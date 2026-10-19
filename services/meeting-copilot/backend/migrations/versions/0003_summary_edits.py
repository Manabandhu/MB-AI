"""summary edit tracking

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-19

Counts hand edits to each summary: the Phase 1 gate is "at most one edit per standup".
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("summaries", sa.Column("edit_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("summaries", sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("summaries", "edited_at")
    op.drop_column("summaries", "edit_count")
