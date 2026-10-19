"""Database tables.

meetings   one row per recording
speakers   per-meeting speaker labels ("me", "S1", "S2"...) and their display names
segments   the transcript, one row per speaker turn
summaries  the profile template's JSON output
action_items  extracted from the summary, queryable on their own
chunks     30-60 s transcript windows with an embedding, for search and chat
"""

import uuid
from datetime import UTC, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .config import get_settings
from .db import Base

JsonType = JSON().with_variant(JSONB(), "postgresql")


def _uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(UTC)


class MeetingStatus:
    CREATED = "created"  # metadata only, waiting for audio
    QUEUED = "queued"  # audio uploaded, waiting for the worker
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(300))
    profile: Mapped[str] = mapped_column(String(40), default="standup")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    duration_s: Mapped[float | None] = mapped_column(Float, nullable=True)
    attendees: Mapped[list] = mapped_column(JsonType, default=list)
    # "mic_system": stereo, left = your mic, right = everyone else (system audio)
    # "mono": a single mixed track (in-person recording, uploaded file)
    channel_layout: Mapped[str] = mapped_column(String(20), default="mono")
    consent_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    audio_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    playback_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default=MeetingStatus.CREATED, index=True)
    stage: Mapped[str | None] = mapped_column(String(40), nullable=True)
    requested_stage: Mapped[str] = mapped_column(String(20), default="full")  # full | summarize
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    speakers: Mapped[list["Speaker"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="Speaker.label"
    )
    segments: Mapped[list["Segment"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="Segment.start"
    )
    summary: Mapped["Summary | None"] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    action_items: Mapped[list["ActionItem"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="ActionItem.id"
    )


class Speaker(Base):
    __tablename__ = "speakers"
    __table_args__ = (UniqueConstraint("meeting_id", "label"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(20))
    display_name: Mapped[str] = mapped_column(String(120))
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)

    meeting: Mapped[Meeting] = relationship(back_populates="speakers")


class Segment(Base):
    __tablename__ = "segments"
    __table_args__ = (Index("ix_segments_meeting_start", "meeting_id", "start"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    speaker_label: Mapped[str] = mapped_column(String(20))
    start: Mapped[float] = mapped_column(Float)
    end: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text)

    meeting: Mapped[Meeting] = relationship(back_populates="segments")


class Summary(Base):
    __tablename__ = "summaries"

    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True)
    profile: Mapped[str] = mapped_column(String(40))
    data: Mapped[dict] = mapped_column(JsonType)
    model: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    meeting: Mapped[Meeting] = relationship(back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    due: Mapped[str | None] = mapped_column(String(60), nullable=True)
    at: Mapped[float | None] = mapped_column(Float, nullable=True)  # seconds into the meeting
    done: Mapped[bool] = mapped_column(Boolean, default=False)

    meeting: Mapped[Meeting] = relationship(back_populates="action_items")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    start: Mapped[float] = mapped_column(Float)
    end: Mapped[float] = mapped_column(Float)
    speakers: Mapped[str] = mapped_column(String(500))
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(get_settings().embed_dim))


Index(
    "ix_chunks_embedding_hnsw",
    Chunk.embedding,
    postgresql_using="hnsw",
    postgresql_ops={"embedding": "vector_cosine_ops"},
)
