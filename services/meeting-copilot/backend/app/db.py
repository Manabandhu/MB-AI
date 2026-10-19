"""Database engine, tenant-scoped sessions and schema migrations.

Isolation between workspaces happens twice:
  1. In the ORM: every SELECT, UPDATE and DELETE on a tenant table gets `workspace_id = <scope>`
     added (with_loader_criteria), and new rows get the scope's workspace and user filled in.
  2. In Postgres: row-level security policies read `app.workspace_id` / `app.system`, which are set
     at the start of every transaction from the session's scope. A bug in (1) still can't leak
     rows when the app connects as a non-owner role (see README, "Row-level security").

A session must carry a Scope. API requests get the caller's workspace; the worker uses the
meeting's workspace while processing it and SYSTEM only to claim work and purge audio.
"""

import logging
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker, with_loader_criteria

from .config import get_settings

log = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


@dataclass(frozen=True)
class Scope:
    workspace_id: str | None
    user_id: str | None
    system: bool = False


SYSTEM = Scope(None, None, system=True)


class ScopeError(RuntimeError):
    pass


_engine = None
_SessionLocal: sessionmaker | None = None


def get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        _engine = create_engine(get_settings().database_url, pool_pre_ping=True, future=True)
        _SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine


def session_factory() -> sessionmaker:
    get_engine()
    assert _SessionLocal is not None
    return _SessionLocal


def new_session(scope: Scope) -> Session:
    session = session_factory()()
    session.info["scope"] = scope
    return session


def set_scope(session: Session, scope: Scope) -> None:
    """Switch a session's scope. Takes effect from the next transaction (commit first)."""
    session.info["scope"] = scope


@contextmanager
def session_scope(scope: Scope = SYSTEM) -> Iterator[Session]:
    """Transactional scope for workers and scripts."""
    session = new_session(scope)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _scope_of(session: Session) -> Scope:
    scope = session.info.get("scope")
    if scope is None:
        raise ScopeError("database session has no tenant scope")
    return scope


# ------------------------------------------------------------------------- ORM tenant filtering


@event.listens_for(Session, "do_orm_execute")
def _tenant_filter(state) -> None:
    if state.is_column_load:
        return
    if not (state.is_select or state.is_update or state.is_delete):
        return
    scope = _scope_of(state.session)
    if scope.system:
        return
    from .models import Tenant

    ws = scope.workspace_id
    state.statement = state.statement.options(
        with_loader_criteria(Tenant, lambda cls: cls.workspace_id == ws, include_aliases=True)
    )


@event.listens_for(Session, "before_flush")
def _fill_tenant(session: Session, flush_context, instances) -> None:
    from .models import Tenant

    scope = session.info.get("scope")
    for obj in session.new:
        if not isinstance(obj, Tenant):
            continue
        if obj.workspace_id is None:
            if scope is None or scope.workspace_id is None:
                raise ScopeError(f"cannot create {type(obj).__name__} without a workspace")
            obj.workspace_id = scope.workspace_id
        elif scope is not None and not scope.system and obj.workspace_id != scope.workspace_id:
            raise ScopeError("cannot create a row in another workspace")
        if obj.user_id is None and scope is not None:
            obj.user_id = scope.user_id


@event.listens_for(Session, "after_begin")
def _set_rls_vars(session: Session, transaction, connection) -> None:
    if connection.dialect.name != "postgresql":
        return
    scope = session.info.get("scope")
    if scope is None:
        return
    connection.execute(
        text("SELECT set_config('app.workspace_id', :ws, true), set_config('app.system', :sys, true)"),
        {"ws": scope.workspace_id or "", "sys": "on" if scope.system else "off"},
    )


# ------------------------------------------------------------------------------- dependencies


def get_system_db() -> Iterator[Session]:
    """FastAPI dependency for the few routes that run before or without a user (signed links, webhooks)."""
    session = new_session(SYSTEM)
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------------- migrations

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"
_LOCK_KEY = 72_731_001  # advisory lock so the API and worker don't migrate at the same time


def _alembic_config(connection):
    from alembic.config import Config

    cfg = Config()
    cfg.set_main_option("script_location", str(MIGRATIONS_DIR))
    cfg.attributes["connection"] = connection
    return cfg


def init_db() -> None:
    """Create the pgvector extension and bring the schema to the latest migration.

    A database created by Phase 1 (tables but no alembic_version) is stamped at 0001 first, so its
    data is kept and upgraded in place.
    """
    from alembic import command

    from . import models  # noqa: F401  (register tables)

    engine = get_engine()
    with engine.connect() as conn:
        conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": _LOCK_KEY})
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            insp = inspect(conn)
            cfg = _alembic_config(conn)
            if insp.has_table("meetings") and not insp.has_table("alembic_version"):
                log.info("found a Phase 1 database; stamping it at revision 0001 before upgrading")
                command.stamp(cfg, "0001")
                conn.commit()
            command.upgrade(cfg, "head")
            conn.commit()
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": _LOCK_KEY})
            conn.commit()
