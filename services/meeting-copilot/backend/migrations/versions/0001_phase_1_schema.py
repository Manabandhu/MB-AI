"""phase 1 schema

Revision ID: 0001
Revises: 
Create Date: 2026-10-19

The schema the Phase 1 build created with metadata.create_all(). Databases created by that build
are stamped at this revision by app.db.init_db() and upgraded from here.
"""

from collections.abc import Sequence

import pgvector.sqlalchemy
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.config import get_settings

revision: str = '0001'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('meetings',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('title', sa.String(length=300), nullable=False),
    sa.Column('profile', sa.String(length=40), nullable=False),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('duration_s', sa.Float(), nullable=True),
    sa.Column('attendees', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('channel_layout', sa.String(length=20), nullable=False),
    sa.Column('consent_confirmed', sa.Boolean(), nullable=False),
    sa.Column('audio_key', sa.String(length=500), nullable=True),
    sa.Column('playback_key', sa.String(length=500), nullable=True),
    sa.Column('audio_deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('stage', sa.String(length=40), nullable=True),
    sa.Column('requested_stage', sa.String(length=20), nullable=False),
    sa.Column('error', sa.Text(), nullable=True),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_meetings_started_at'), 'meetings', ['started_at'], unique=False)
    op.create_index(op.f('ix_meetings_status'), 'meetings', ['status'], unique=False)
    op.create_table('action_items',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('owner', sa.String(length=120), nullable=True),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('due', sa.String(length=60), nullable=True),
    sa.Column('at', sa.Float(), nullable=True),
    sa.Column('done', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_action_items_meeting_id'), 'action_items', ['meeting_id'], unique=False)
    op.create_table('chunks',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('start', sa.Float(), nullable=False),
    sa.Column('end', sa.Float(), nullable=False),
    sa.Column('speakers', sa.String(length=500), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('embedding', pgvector.sqlalchemy.Vector(get_settings().embed_dim), nullable=False),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chunks_embedding_hnsw', 'chunks', ['embedding'], unique=False, postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.create_index(op.f('ix_chunks_meeting_id'), 'chunks', ['meeting_id'], unique=False)
    op.create_table('segments',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('speaker_label', sa.String(length=20), nullable=False),
    sa.Column('start', sa.Float(), nullable=False),
    sa.Column('end', sa.Float(), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_segments_meeting_start', 'segments', ['meeting_id', 'start'], unique=False)
    op.create_table('speakers',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('label', sa.String(length=20), nullable=False),
    sa.Column('display_name', sa.String(length=120), nullable=False),
    sa.Column('is_owner', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('meeting_id', 'label')
    )
    op.create_index(op.f('ix_speakers_meeting_id'), 'speakers', ['meeting_id'], unique=False)
    op.create_table('summaries',
    sa.Column('meeting_id', sa.String(length=36), nullable=False),
    sa.Column('profile', sa.String(length=40), nullable=False),
    sa.Column('data', sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'), nullable=False),
    sa.Column('model', sa.String(length=200), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['meeting_id'], ['meetings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('meeting_id')
    )


def downgrade() -> None:
    op.drop_table('summaries')
    op.drop_index(op.f('ix_speakers_meeting_id'), table_name='speakers')
    op.drop_table('speakers')
    op.drop_index('ix_segments_meeting_start', table_name='segments')
    op.drop_table('segments')
    op.drop_index(op.f('ix_chunks_meeting_id'), table_name='chunks')
    op.drop_index('ix_chunks_embedding_hnsw', table_name='chunks', postgresql_using='hnsw', postgresql_ops={'embedding': 'vector_cosine_ops'})
    op.drop_table('chunks')
    op.drop_index(op.f('ix_action_items_meeting_id'), table_name='action_items')
    op.drop_table('action_items')
    op.drop_index(op.f('ix_meetings_status'), table_name='meetings')
    op.drop_index(op.f('ix_meetings_started_at'), table_name='meetings')
    op.drop_table('meetings')
