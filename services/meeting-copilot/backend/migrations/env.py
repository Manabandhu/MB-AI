"""Alembic environment. Migrations run from app.db.init_db() (API and worker start-up) or the CLI:

    alembic -c alembic.ini upgrade head
"""

from alembic import context
from sqlalchemy import create_engine

from app import models  # noqa: F401  (register tables)
from app.config import get_settings
from app.db import Base

target_metadata = Base.metadata


def _run(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


connection = context.config.attributes.get("connection")
if connection is not None:
    _run(connection)
else:
    engine = create_engine(get_settings().database_url)
    with engine.connect() as conn:
        _run(conn)
        conn.commit()
