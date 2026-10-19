from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Link(BaseModel):
    title: str = Field(default="", max_length=300)
    url: str = Field(min_length=1, max_length=1000)


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    profile: str = "standup"  # or "auto": detected from the title, attendees and first minutes
    started_at: datetime | None = None
    attendees: list[str] = Field(default_factory=list)
    channel_layout: Literal["mic_system", "mono"] = "mono"
    consent_confirmed: bool = False
    consent_method: Literal["tap", "verbal", "bot_notice", "written"] = "tap"
    source: Literal["upload", "browser", "desktop", "live", "bot", "mobile"] = "upload"
    local_only: bool = False
    links: list[Link] = Field(default_factory=list)
    calendar_event_id: str | None = None
    meeting_url: str | None = None


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    profile: str | None = None
    attendees: list[str] | None = None
    links: list[Link] | None = None
    local_only: bool | None = None


class ConsentRequest(BaseModel):
    method: Literal["tap", "verbal", "bot_notice", "written"] = "tap"
    note: str = Field(default="", max_length=300)


class SpeakerOut(ORM):
    label: str
    display_name: str
    is_owner: bool


class SegmentOut(ORM):
    id: int
    speaker_label: str
    start: float
    end: float
    text: str


class ActionItemOut(ORM):
    id: int
    meeting_id: str
    owner: str | None
    text: str
    due: str | None
    at: float | None
    done: bool


class MeetingListItem(ORM):
    id: str
    title: str
    profile: str
    user_id: str | None = None
    started_at: datetime
    duration_s: float | None
    status: str
    stage: str | None
    error: str | None
    overview: str | None = None
    open_action_items: int = 0


class MeetingDetail(MeetingListItem):
    attendees: list[str]
    channel_layout: str
    consent_confirmed: bool
    consent_state: str
    consent_log: list[dict]
    source: str
    local_only: bool
    off_record: list[list[float]]
    links: list[dict]
    calendar_event_id: str | None
    profile_source: str
    processed_at: datetime | None
    has_audio: bool
    audio_deleted_at: datetime | None
    speakers: list[SpeakerOut]
    segments: list[SegmentOut]
    summary: dict | None
    summary_model: str | None
    action_items: list[ActionItemOut]


class SpeakerUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)


class SpeakerMerge(BaseModel):
    from_label: str
    into_label: str


class ActionItemUpdate(BaseModel):
    done: bool


class ReprocessRequest(BaseModel):
    stage: Literal["full", "summarize", "index"] = "summarize"


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    meeting_id: str | None = None
    since: date | None = None
    until: date | None = None
    history: list[ChatTurn] = Field(default_factory=list)


class Source(BaseModel):
    n: int
    kind: Literal["transcript", "summary"]
    meeting_id: str
    meeting_title: str
    started_at: datetime
    start: float | None
    end: float | None
    speakers: str
    text: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]


class SearchHit(BaseModel):
    meeting_id: str
    meeting_title: str
    started_at: datetime
    start: float
    end: float
    speakers: str
    text: str
    score: float
