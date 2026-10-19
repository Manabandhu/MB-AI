"""memory speaker id live assist tenancy

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-19

Phases 2-5: workspaces, users and tokens; people and opt-in voiceprints; entities, decisions and
commitments; glossary, custom profiles, documents; live answer cards; speaker corrections; audit log.

Existing Phase 1 rows are moved into one personal workspace owned by a bootstrap user (the person
who signs in with API_TOKEN). Every tenant table then gets row-level security.
"""

import uuid
from collections.abc import Sequence

import pgvector.sqlalchemy
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.config import get_settings

revision: str = '0002'
down_revision: str | None = '0001'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


JSONB = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")
TENANT_TABLES = (
    "meetings", "speakers", "segments", "summaries", "action_items", "chunks", "people", "voiceprints",
    "entities", "entity_mentions", "decisions", "commitments", "commitment_mentions", "glossary_terms",
    "custom_profiles", "documents", "live_cards", "speaker_corrections", "audit_log",
)  # fmt: skip
EXISTING = ("meetings", "speakers", "segments", "summaries", "action_items", "chunks")


def _tenant_columns(table: str) -> None:
    op.add_column(table, sa.Column("workspace_id", sa.String(length=36), nullable=True))
    op.add_column(table, sa.Column("user_id", sa.String(length=36), nullable=True))


def _finish_tenant_columns(table: str) -> None:
    op.alter_column(table, "workspace_id", nullable=False)
    op.create_index(f"ix_{table}_workspace_id", table, ["workspace_id"], unique=False)
    op.create_foreign_key(f"fk_{table}_workspace", table, "workspaces", ["workspace_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key(f"fk_{table}_user", table, "users", ["user_id"], ["id"], ondelete="SET NULL")


def enable_rls(table: str) -> None:
    """Rows are visible only inside the transaction's workspace, or to system jobs (worker)."""
    op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
    op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
    op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table}")
    op.execute(
        f"""CREATE POLICY tenant_isolation ON {table}
        USING (current_setting('app.system', true) = 'on'
               OR workspace_id = current_setting('app.workspace_id', true))
        WITH CHECK (current_setting('app.system', true) = 'on'
               OR workspace_id = current_setting('app.workspace_id', true))"""
    )


def upgrade() -> None:
    op.create_table('users',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('email', sa.String(length=320), nullable=True),
    sa.Column('display_name', sa.String(length=120), nullable=False),
    sa.Column('aliases', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('watched_keywords', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('oidc_sub', sa.String(length=255), nullable=True),
    sa.Column('is_bootstrap', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('oidc_sub')
    )
    op.create_table('workspaces',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('is_personal', sa.Boolean(), nullable=False),
    sa.Column('settings', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('api_tokens',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('prefix', sa.String(length=16), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('token_hash')
    )
    op.create_index(op.f('ix_api_tokens_user_id'), 'api_tokens', ['user_id'], unique=False)
    op.create_table('audit_log',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('action', sa.String(length=40), nullable=False),
    sa.Column('target_type', sa.String(length=40), nullable=False),
    sa.Column('target_id', sa.String(length=64), nullable=True),
    sa.Column('meta', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('ip', sa.String(length=64), nullable=True),
    sa.Column('at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_log_action'), 'audit_log', ['action'], unique=False)
    op.create_index(op.f('ix_audit_log_at'), 'audit_log', ['at'], unique=False)
    op.create_index(op.f('ix_audit_log_workspace_id'), 'audit_log', ['workspace_id'], unique=False)
    op.create_table('custom_profiles',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('key', sa.String(length=40), nullable=False),
    sa.Column('label', sa.String(length=120), nullable=False),
    sa.Column('instructions', sa.Text(), nullable=False),
    sa.Column('fields', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('live_prompt', sa.Text(), nullable=False),
    sa.Column('keywords', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('per_person', sa.Boolean(), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('workspace_id', 'key')
    )
    op.create_index(op.f('ix_custom_profiles_workspace_id'), 'custom_profiles', ['workspace_id'], unique=False)
    op.create_table('documents',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('title', sa.String(length=300), nullable=False),
    sa.Column('url', sa.String(length=1000), nullable=True),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('embedding', pgvector.sqlalchemy.Vector(get_settings().embed_dim), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_workspace_id'), 'documents', ['workspace_id'], unique=False)
    op.create_table('entities',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('aliases', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('workspace_id', 'kind', 'name')
    )
    op.create_index(op.f('ix_entities_workspace_id'), 'entities', ['workspace_id'], unique=False)
    op.create_table('glossary_terms',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('term', sa.String(length=200), nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('definition', sa.Text(), nullable=True),
    sa.Column('aliases', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('watched', sa.Boolean(), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('workspace_id', 'term')
    )
    op.create_index(op.f('ix_glossary_terms_workspace_id'), 'glossary_terms', ['workspace_id'], unique=False)
    op.create_table('memberships',
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('workspace_id', 'user_id')
    )
    op.create_table('people',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('display_name', sa.String(length=120), nullable=False),
    sa.Column('email', sa.String(length=320), nullable=True),
    sa.Column('aliases', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('account_user_id', sa.String(length=36), nullable=True),
    sa.Column('consent_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['account_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_people_workspace_id'), 'people', ['workspace_id'], unique=False)
    op.create_table('commitments',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('owner', sa.String(length=120), nullable=True),
    sa.Column('owner_person_id', sa.String(length=36), nullable=True),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('due', sa.String(length=60), nullable=True),
    sa.Column('due_date', sa.Date(), nullable=True),
    sa.Column('status', sa.String(length=10), nullable=False),
    sa.Column('first_meeting_id', sa.String(length=36), nullable=True),
    sa.Column('last_meeting_id', sa.String(length=36), nullable=True),
    sa.Column('first_mentioned_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('last_mentioned_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('mention_count', sa.Integer(), nullable=False),
    sa.Column('done_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('jira_key', sa.String(length=40), nullable=True),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['first_meeting_id'], ['meetings.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['last_meeting_id'], ['meetings.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['owner_person_id'], ['people.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_commitments_last_mentioned_at'), 'commitments', ['last_mentioned_at'], unique=False)
    op.create_index(op.f('ix_commitments_owner'), 'commitments', ['owner'], unique=False)
    op.create_index(op.f('ix_commitments_status'), 'commitments', ['status'], unique=False)
    op.create_index(op.f('ix_commitments_workspace_id'), 'commitments', ['workspace_id'], unique=False)
    op.create_table('decisions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('owner', sa.String(length=120), nullable=True),
    sa.Column('owner_person_id', sa.String(length=36), nullable=True),
    sa.Column('decided_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('at', sa.Float(), nullable=True),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['owner_person_id'], ['people.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_decisions_decided_at'), 'decisions', ['decided_at'], unique=False)
    op.create_index(op.f('ix_decisions_meeting_id'), 'decisions', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_decisions_workspace_id'), 'decisions', ['workspace_id'], unique=False)
    op.create_table('entity_mentions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('entity_id', sa.Integer(), nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('first_at', sa.Float(), nullable=True),
    sa.Column('count', sa.Integer(), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entities.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('entity_id', 'meeting_id')
    )
    op.create_index(op.f('ix_entity_mentions_entity_id'), 'entity_mentions', ['entity_id'], unique=False)
    op.create_index(op.f('ix_entity_mentions_meeting_id'), 'entity_mentions', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_entity_mentions_workspace_id'), 'entity_mentions', ['workspace_id'], unique=False)
    op.create_table('live_cards',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('trigger', sa.String(length=20), nullable=False),
    sa.Column('trigger_text', sa.Text(), nullable=False),
    sa.Column('at', sa.Float(), nullable=True),
    sa.Column('answer', sa.Text(), nullable=False),
    sa.Column('facts', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('sources', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('grounded', sa.Boolean(), nullable=False),
    sa.Column('confidence', sa.Float(), nullable=False),
    sa.Column('timings_ms', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('feedback', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_live_cards_meeting_id'), 'live_cards', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_live_cards_workspace_id'), 'live_cards', ['workspace_id'], unique=False)
    op.create_table('speaker_corrections',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('segment_id', sa.Integer(), nullable=True),
    sa.Column('from_label', sa.String(length=20), nullable=False),
    sa.Column('to_label', sa.String(length=20), nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('segments_affected', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_speaker_corrections_meeting_id'), 'speaker_corrections', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_speaker_corrections_workspace_id'), 'speaker_corrections', ['workspace_id'], unique=False)
    op.create_table('voiceprints',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('person_id', sa.String(length=36), nullable=False),
    sa.Column('embedding', pgvector.sqlalchemy.Vector(get_settings().voiceprint_dim), nullable=False),
    sa.Column('model', sa.String(length=200), nullable=False),
    sa.Column('clips', sa.Integer(), nullable=False),
    sa.Column('seconds', sa.Float(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['person_id'], ['people.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voiceprints_person_id'), 'voiceprints', ['person_id'], unique=False)
    op.create_index(op.f('ix_voiceprints_workspace_id'), 'voiceprints', ['workspace_id'], unique=False)
    op.create_table('commitment_mentions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('commitment_id', sa.Integer(), nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('said_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('at', sa.Float(), nullable=True),
    sa.Column('kind', sa.String(length=10), nullable=False),
    sa.Column('workspace_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=True),
    sa.ForeignKeyConstraint(['commitment_id'], ['commitments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('commitment_id', 'meeting_id')
    )
    op.create_index(op.f('ix_commitment_mentions_commitment_id'), 'commitment_mentions', ['commitment_id'], unique=False)
    op.create_index(op.f('ix_commitment_mentions_meeting_id'), 'commitment_mentions', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_commitment_mentions_workspace_id'), 'commitment_mentions', ['workspace_id'], unique=False)
    # ---- Phase 1 tables: new columns, then move existing rows into a default workspace ----
    op.add_column("action_items", sa.Column("commitment_id", sa.Integer(), nullable=True))
    op.add_column("action_items", sa.Column("jira_draft", JSONB, nullable=True))
    op.add_column("action_items", sa.Column("jira_key", sa.String(length=40), nullable=True))
    op.create_index("ix_action_items_commitment_id", "action_items", ["commitment_id"], unique=False)
    op.create_foreign_key(
        "fk_action_items_commitment", "action_items", "commitments", ["commitment_id"], ["id"], ondelete="SET NULL"
    )

    meeting_columns = [
        sa.Column("profile_source", sa.String(length=10), nullable=False, server_default="user"),
        sa.Column("calendar_event_id", sa.String(length=300), nullable=True),
        sa.Column("links", JSONB, nullable=False, server_default="[]"),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="upload"),
        sa.Column("consent_state", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("consent_log", JSONB, nullable=False, server_default="[]"),
        sa.Column("off_record", JSONB, nullable=False, server_default="[]"),
        sa.Column("local_only", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("platform_turns", JSONB, nullable=False, server_default="[]"),
        sa.Column("bot_id", sa.String(length=200), nullable=True),
        sa.Column("bot_status", sa.String(length=60), nullable=True),
        sa.Column("meeting_url", sa.String(length=1000), nullable=True),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
    ]
    for col in meeting_columns:
        op.add_column("meetings", col)
    op.execute("UPDATE meetings SET consent_state = 'confirmed' WHERE consent_confirmed")

    op.add_column("speakers", sa.Column("person_id", sa.String(length=36), nullable=True))
    op.add_column("speakers", sa.Column("match_source", sa.String(length=20), nullable=True))
    op.add_column("speakers", sa.Column("match_score", sa.Float(), nullable=True))
    op.create_foreign_key("fk_speakers_person", "speakers", "people", ["person_id"], ["id"], ondelete="SET NULL")
    op.execute("UPDATE speakers SET match_source = 'owner' WHERE is_owner")

    for table in EXISTING:
        _tenant_columns(table)

    conn = op.get_bind()
    if conn.execute(sa.text("SELECT count(*) FROM meetings")).scalar():
        ws, user = str(uuid.uuid4()), str(uuid.uuid4())
        settings = get_settings()
        conn.execute(
            sa.text(
                "INSERT INTO workspaces (id, name, is_personal, settings, created_at) "
                "VALUES (:id, :name, true, '{}', now())"
            ),
            {"id": ws, "name": settings.default_workspace_name},
        )
        conn.execute(
            sa.text(
                "INSERT INTO users (id, display_name, aliases, watched_keywords, is_bootstrap, created_at) "
                "VALUES (:id, :name, '[]', '[]', true, now())"
            ),
            {"id": user, "name": settings.owner_name},
        )
        conn.execute(
            sa.text("INSERT INTO memberships (workspace_id, user_id, role, created_at) VALUES (:w, :u, 'owner', now())"),
            {"w": ws, "u": user},
        )
        conn.execute(sa.text("UPDATE meetings SET workspace_id = :w, user_id = :u"), {"w": ws, "u": user})
        for table in EXISTING[1:]:
            conn.execute(
                sa.text(
                    f"UPDATE {table} t SET workspace_id = m.workspace_id, user_id = m.user_id "
                    "FROM meetings m WHERE m.id = t.meeting_id"
                )
            )

    for table in EXISTING:
        _finish_tenant_columns(table)

    for table in TENANT_TABLES:
        enable_rls(table)


def downgrade() -> None:
    raise NotImplementedError("0002 adds tenancy and memory tables; restore a backup to go back to Phase 1")
