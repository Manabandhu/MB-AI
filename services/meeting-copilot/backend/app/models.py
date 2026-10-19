"""Database tables.

Tenancy
  workspaces, users, memberships, api_tokens
  Every other table carries workspace_id and user_id. The ORM adds a workspace filter to every
  query (db.py) and Postgres row-level security enforces the same rule underneath it.

Meetings (Phase 1)
  meetings     one row per recording
  speakers     per-meeting speaker labels ("me", "S1", "S2"...), their names and who they are
  segments     the transcript, one row per speaker turn
  summaries    the profile template's JSON output
  action_items extracted from the summary, linked to the cross-meeting commitment they feed
  chunks       30-60 s transcript windows with an embedding, for search and chat

Memory (Phases 2-5)
  people, voiceprints            who is who; voiceprints are opt-in embeddings, never audio
  entities, entity_mentions      projects, systems, orgs and topics meetings talk about
  decisions                      what was agreed
  commitments, commitment_mentions   who owes what, tracked across meetings
  glossary_terms                 team vocabulary; also fed to STT
  custom_profiles                user-defined meeting types
  documents                      runbooks and linked docs for briefs and incident mode
  live_cards                     answer cards shown during meetings, with feedback
  speaker_corrections            fix-speaker taps, used to measure speaker accuracy
  audit_log                      who viewed or exported what
"""

import uuid
from datetime import UTC, date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    JSON,
    Boolean,
    Date,
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


# ---------------------------------------------------------------------------------------- tenancy


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200))
    is_personal: Mapped[bool] = mapped_column(Boolean, default=True)
    # Integration settings (Slack/Teams/Jira/GitHub/calendar). Secrets are masked when read back.
    settings: Mapped[dict] = mapped_column(JsonType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, nullable=True)
    display_name: Mapped[str] = mapped_column(String(120))
    aliases: Mapped[list] = mapped_column(JsonType, default=list)  # other names people call you
    watched_keywords: Mapped[list] = mapped_column(JsonType, default=list)  # raise a card when said
    oidc_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    is_bootstrap: Mapped[bool] = mapped_column(Boolean, default=False)  # signs in with API_TOKEN
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Membership(Base):
    __tablename__ = "memberships"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), default="member")  # owner | member
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ApiToken(Base):
    __tablename__ = "api_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    prefix: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Tenant:
    """Mixin: the row belongs to a workspace and was created by a user."""

    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


TENANT_TABLES = (
    "meetings",
    "speakers",
    "segments",
    "summaries",
    "action_items",
    "chunks",
    "people",
    "voiceprints",
    "entities",
    "entity_mentions",
    "decisions",
    "commitments",
    "commitment_mentions",
    "glossary_terms",
    "custom_profiles",
    "documents",
    "live_cards",
    "speaker_corrections",
    "audit_log",
)


# --------------------------------------------------------------------------------------- meetings


class MeetingStatus:
    CREATED = "created"  # metadata only, waiting for audio
    LIVE = "live"  # a live session is streaming audio or captions right now
    QUEUED = "queued"  # audio uploaded, waiting for the worker
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Meeting(Tenant, Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(300))
    profile: Mapped[str] = mapped_column(String(40), default="standup")
    profile_source: Mapped[str] = mapped_column(String(10), default="user")  # user | auto
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    duration_s: Mapped[float | None] = mapped_column(Float, nullable=True)
    attendees: Mapped[list] = mapped_column(JsonType, default=list)
    calendar_event_id: Mapped[str | None] = mapped_column(String(300), nullable=True)
    links: Mapped[list] = mapped_column(JsonType, default=list)  # linked docs: [{"title", "url"}]
    # "mic_system": stereo, left = your mic, right = everyone else (system audio)
    # "mono": a single mixed track (in-person recording, uploaded file)
    channel_layout: Mapped[str] = mapped_column(String(20), default="mono")
    source: Mapped[str] = mapped_column(String(20), default="upload")  # upload|browser|desktop|live|bot|mobile
    # Consent is a launch blocker: no audio is accepted until consent_state is "confirmed".
    consent_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_state: Mapped[str] = mapped_column(String(20), default="pending")  # pending | confirmed
    consent_log: Mapped[list] = mapped_column(JsonType, default=list)  # [{"method", "at", "by"}]
    off_record: Mapped[list] = mapped_column(JsonType, default=list)  # [[start_s, end_s]] paused spans
    local_only: Mapped[bool] = mapped_column(Boolean, default=False)  # never send to a third-party API
    platform_turns: Mapped[list] = mapped_column(JsonType, default=list)  # speaker labels from bot/Teams
    bot_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    bot_status: Mapped[str | None] = mapped_column(String(60), nullable=True)
    meeting_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    audio_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    playback_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default=MeetingStatus.CREATED, index=True)
    stage: Mapped[str | None] = mapped_column(String(40), nullable=True)
    requested_stage: Mapped[str] = mapped_column(String(20), default="full")  # full | summarize | index
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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
    decisions: Mapped[list["Decision"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="Decision.id"
    )


class Speaker(Tenant, Base):
    __tablename__ = "speakers"
    __table_args__ = (UniqueConstraint("meeting_id", "label"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(20))
    display_name: Mapped[str] = mapped_column(String(120))
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)
    person_id: Mapped[str | None] = mapped_column(ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    # owner (mic channel) | platform (bot / Teams labels) | voiceprint | manual
    match_source: Mapped[str | None] = mapped_column(String(20), nullable=True)
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    meeting: Mapped[Meeting] = relationship(back_populates="speakers")


class Segment(Tenant, Base):
    __tablename__ = "segments"
    __table_args__ = (Index("ix_segments_meeting_start", "meeting_id", "start"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    speaker_label: Mapped[str] = mapped_column(String(20))
    start: Mapped[float] = mapped_column(Float)
    end: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text)

    meeting: Mapped[Meeting] = relationship(back_populates="segments")


class Summary(Tenant, Base):
    __tablename__ = "summaries"

    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True)
    profile: Mapped[str] = mapped_column(String(40))
    data: Mapped[dict] = mapped_column(JsonType)
    model: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    meeting: Mapped[Meeting] = relationship(back_populates="summary")


class ActionItem(Tenant, Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    due: Mapped[str | None] = mapped_column(String(60), nullable=True)
    at: Mapped[float | None] = mapped_column(Float, nullable=True)  # seconds into the meeting
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    commitment_id: Mapped[int | None] = mapped_column(
        ForeignKey("commitments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    jira_draft: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    jira_key: Mapped[str | None] = mapped_column(String(40), nullable=True)

    meeting: Mapped[Meeting] = relationship(back_populates="action_items")


class Chunk(Tenant, Base):
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


# ------------------------------------------------------------------------------------------ people


class Person(Tenant, Base):
    __tablename__ = "people"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    display_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    aliases: Mapped[list] = mapped_column(JsonType, default=list)
    account_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )  # set when this person is an app user (you)
    # Explicit biometric consent for a voiceprint (Illinois BIPA, Texas CUBI). None = no voiceprint.
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    voiceprints: Mapped[list["Voiceprint"]] = relationship(back_populates="person", cascade="all, delete-orphan")


class Voiceprint(Tenant, Base):
    __tablename__ = "voiceprints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id", ondelete="CASCADE"), index=True)
    embedding: Mapped[list[float]] = mapped_column(Vector(get_settings().voiceprint_dim))
    model: Mapped[str] = mapped_column(String(200))
    clips: Mapped[int] = mapped_column(Integer, default=1)
    seconds: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    person: Mapped[Person] = relationship(back_populates="voiceprints")


class SpeakerCorrection(Tenant, Base):
    __tablename__ = "speaker_corrections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    segment_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # None = whole cluster
    from_label: Mapped[str] = mapped_column(String(20))
    to_label: Mapped[str] = mapped_column(String(20))
    kind: Mapped[str] = mapped_column(String(20))  # line | merge | person
    segments_affected: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# ------------------------------------------------------------------------------------------ memory


class Entity(Tenant, Base):
    __tablename__ = "entities"
    __table_args__ = (UniqueConstraint("workspace_id", "kind", "name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kind: Mapped[str] = mapped_column(String(20))  # project | system | org | topic
    name: Mapped[str] = mapped_column(String(200))
    aliases: Mapped[list] = mapped_column(JsonType, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EntityMention(Tenant, Base):
    __tablename__ = "entity_mentions"
    __table_args__ = (UniqueConstraint("entity_id", "meeting_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_id: Mapped[int] = mapped_column(ForeignKey("entities.id", ondelete="CASCADE"), index=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    first_at: Mapped[float | None] = mapped_column(Float, nullable=True)
    count: Mapped[int] = mapped_column(Integer, default=1)


class Decision(Tenant, Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(Text)
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    owner_person_id: Mapped[str | None] = mapped_column(ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    at: Mapped[float | None] = mapped_column(Float, nullable=True)

    meeting: Mapped[Meeting] = relationship(back_populates="decisions")


class CommitmentStatus:
    OPEN = "open"
    DONE = "done"
    DROPPED = "dropped"


class Commitment(Tenant, Base):
    __tablename__ = "commitments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    owner_person_id: Mapped[str | None] = mapped_column(ForeignKey("people.id", ondelete="SET NULL"), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    due: Mapped[str | None] = mapped_column(String(60), nullable=True)  # as said ("Wednesday")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # resolved against the meeting date
    status: Mapped[str] = mapped_column(String(10), default=CommitmentStatus.OPEN, index=True)
    first_meeting_id: Mapped[str | None] = mapped_column(ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True)
    last_meeting_id: Mapped[str | None] = mapped_column(ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True)
    first_mentioned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_mentioned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    mention_count: Mapped[int] = mapped_column(Integer, default=1)
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    jira_key: Mapped[str | None] = mapped_column(String(40), nullable=True)


class CommitmentMention(Tenant, Base):
    __tablename__ = "commitment_mentions"
    __table_args__ = (UniqueConstraint("commitment_id", "meeting_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    commitment_id: Mapped[int] = mapped_column(ForeignKey("commitments.id", ondelete="CASCADE"), index=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    said_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    at: Mapped[float | None] = mapped_column(Float, nullable=True)
    kind: Mapped[str] = mapped_column(String(10), default="made")  # made | progress | done


class GlossaryTerm(Tenant, Base):
    __tablename__ = "glossary_terms"
    __table_args__ = (UniqueConstraint("workspace_id", "term"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    term: Mapped[str] = mapped_column(String(200))
    kind: Mapped[str] = mapped_column(String(20), default="term")  # term | project | system | org | topic
    definition: Mapped[str | None] = mapped_column(Text, nullable=True)  # for explain-a-term cards
    aliases: Mapped[list] = mapped_column(JsonType, default=list)
    watched: Mapped[bool] = mapped_column(Boolean, default=False)  # raises a live card when said


class CustomProfile(Tenant, Base):
    __tablename__ = "custom_profiles"
    __table_args__ = (UniqueConstraint("workspace_id", "key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(40))
    label: Mapped[str] = mapped_column(String(120))
    instructions: Mapped[str] = mapped_column(Text)  # the summary prompt
    fields: Mapped[list] = mapped_column(JsonType, default=list)  # [{"key","label","hint","type"}]
    live_prompt: Mapped[str] = mapped_column(Text, default="")
    keywords: Mapped[list] = mapped_column(JsonType, default=list)  # for auto-detection
    per_person: Mapped[bool] = mapped_column(Boolean, default=False)


class Document(Tenant, Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(300))
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    kind: Mapped[str] = mapped_column(String(20), default="doc")  # doc | runbook
    text: Mapped[str] = mapped_column(Text, default="")
    embedding: Mapped[list[float] | None] = mapped_column(Vector(get_settings().embed_dim), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class LiveCard(Tenant, Base):
    __tablename__ = "live_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))  # answer | explain | nudge | keyword | update
    trigger: Mapped[str] = mapped_column(String(20))  # name | question | keyword | commitment | manual
    trigger_text: Mapped[str] = mapped_column(Text, default="")
    at: Mapped[float | None] = mapped_column(Float, nullable=True)  # seconds into the meeting
    answer: Mapped[str] = mapped_column(Text, default="")
    facts: Mapped[list] = mapped_column(JsonType, default=list)
    sources: Mapped[list] = mapped_column(JsonType, default=list)
    grounded: Mapped[bool] = mapped_column(Boolean, default=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    timings_ms: Mapped[dict] = mapped_column(JsonType, default=dict)
    feedback: Mapped[int] = mapped_column(Integer, default=0)  # -1, 0, +1
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Tenant, Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(40), index=True)  # view | export | delete | audio | ...
    target_type: Mapped[str] = mapped_column(String(40))
    target_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    meta: Mapped[dict] = mapped_column(JsonType, default=dict)
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
