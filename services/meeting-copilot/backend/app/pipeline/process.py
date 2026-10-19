"""The post-meeting pipeline: audio in, speaker-labelled transcript, summary and search index out.

Stereo recordings from the desktop or browser recorder carry your mic on the left channel and the
meeting's audio (everyone else) on the right. That gives "you vs. them" for free; diarization only
has to separate the other people.
"""

import logging
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from ..config import Settings
from ..db import SYSTEM, Scope, set_scope
from ..models import ActionItem, Chunk, Meeting, MeetingStatus, Segment, Speaker, Summary, User, utcnow
from ..privacy import maybe_redact, third_party_providers
from ..providers import LLM, Diarizer, Embedder, ProviderError, Transcriber
from ..storage import Storage
from . import audio
from .chunking import chunk_lines
from .profiles import get_profile
from .summarize import summarize_transcript
from .transcript import OWNER_LABEL, Line, assign_speakers, drop_echo, format_transcript, merge_adjacent, relabel

log = logging.getLogger(__name__)

SILENT_DBFS = -65.0  # a channel quieter than this over the whole recording is treated as empty


@dataclass
class Providers:
    stt: Transcriber
    diarizer: Diarizer
    llm: LLM
    embedder: Embedder


def _set_stage(session: Session, meeting: Meeting, stage: str) -> None:
    meeting.stage = stage
    session.commit()
    log.info("meeting %s: %s", meeting.id, stage)


def _diarized_lines(wav: Path, p: Providers, fallback: str, session: Session, meeting: Meeting) -> list[Line]:
    segments = p.stt.transcribe(wav, diarize=True)
    turns = []
    if segments and not p.stt.returns_speakers:
        _set_stage(session, meeting, "diarizing")
        turns = p.diarizer.diarize(wav)
    return assign_speakers(segments, turns, fallback=fallback)


def transcribe_audio(session: Session, meeting: Meeting, storage: Storage, p: Providers, settings: Settings) -> None:
    if not meeting.audio_key:
        raise RuntimeError("this meeting has no audio (it may have been removed by the retention policy)")
    with tempfile.TemporaryDirectory(prefix="copilot-") as tmp_dir:
        tmp = Path(tmp_dir)
        src = tmp / ("source" + Path(meeting.audio_key).suffix)
        _set_stage(session, meeting, "preparing audio")
        storage.get_file(meeting.audio_key, src)

        stereo = meeting.channel_layout == "mic_system" and audio.source_channels(src) >= 2
        norm = tmp / "normalized.wav"
        meeting.duration_s = audio.normalize(src, norm, channels=2 if stereo else 1)

        playback = tmp / "playback.m4a"
        audio.make_playback(norm, playback)
        meeting.playback_key = f"{meeting.id}/playback.m4a"
        storage.put_file(playback, meeting.playback_key)

        _set_stage(session, meeting, "transcribing")
        if stereo:
            mic, system = tmp / "mic.wav", tmp / "system.wav"
            audio.split_stereo(norm, mic, system)
            mine: list[Line] = []
            if audio.rms_dbfs(mic) > SILENT_DBFS:
                mine = [Line(s.start, s.end, OWNER_LABEL, s.text) for s in p.stt.transcribe(mic, diarize=False)]
            others: list[Line] = []
            if audio.rms_dbfs(system) > SILENT_DBFS:
                others = _diarized_lines(system, p, fallback="others", session=session, meeting=meeting)
            lines = drop_echo(mine, others) + others
        else:
            lines = _diarized_lines(norm, p, fallback="speaker", session=session, meeting=meeting)

        lines = merge_adjacent(relabel(lines))

    session.execute(delete(Segment).where(Segment.meeting_id == meeting.id))
    session.execute(delete(Speaker).where(Speaker.meeting_id == meeting.id))
    labels = list(dict.fromkeys(ln.speaker for ln in lines))
    if OWNER_LABEL in labels:
        labels.remove(OWNER_LABEL)
        labels.insert(0, OWNER_LABEL)
    owner_name = owner_display_name(session, meeting, settings)
    for label in labels:
        owner = label == OWNER_LABEL
        name = owner_name if owner else f"Speaker {label[1:]}"
        session.add(
            Speaker(
                meeting_id=meeting.id,
                label=label,
                display_name=name,
                is_owner=owner,
                match_source="owner" if owner else None,
            )
        )
    session.add_all(
        Segment(
            meeting_id=meeting.id,
            speaker_label=ln.speaker,
            start=ln.start,
            end=ln.end,
            text=maybe_redact(ln.text, settings),
        )
        for ln in lines
    )
    session.commit()


def owner_display_name(session: Session, meeting: Meeting, settings: Settings) -> str:
    """The person who recorded the meeting is the mic channel ("me")."""
    user = session.get(User, meeting.user_id) if meeting.user_id else None
    return user.display_name if user else settings.owner_name


def _transcript(session: Session, meeting: Meeting) -> tuple[list[Line], dict[str, str]]:
    speakers = session.scalars(select(Speaker).where(Speaker.meeting_id == meeting.id)).all()
    names = {s.label: s.display_name for s in speakers}
    segments = session.scalars(select(Segment).where(Segment.meeting_id == meeting.id).order_by(Segment.start)).all()
    return [Line(s.start, s.end, s.speaker_label, s.text) for s in segments], names


def summarize(session: Session, meeting: Meeting, p: Providers, settings: Settings) -> None:
    lines, names = _transcript(session, meeting)
    _set_stage(session, meeting, "summarizing")
    profile = get_profile(meeting.profile)
    summary = summarize_transcript(
        p.llm,
        format_transcript(lines, names),
        profile,
        title=meeting.title,
        started_at=meeting.started_at,
        speakers=list(names.values()),
        max_chars=settings.llm_max_input_chars,
    )
    session.execute(delete(Summary).where(Summary.meeting_id == meeting.id))
    session.execute(delete(ActionItem).where(ActionItem.meeting_id == meeting.id))
    session.add(Summary(meeting_id=meeting.id, profile=profile.key, data=summary.model_dump(), model=p.llm.name))
    session.add_all(
        ActionItem(meeting_id=meeting.id, owner=a.owner, text=a.text, due=a.due, at=a.at) for a in summary.action_items
    )
    session.commit()


def index(session: Session, meeting: Meeting, p: Providers) -> None:
    lines, names = _transcript(session, meeting)
    _set_stage(session, meeting, "indexing")
    chunks = chunk_lines(lines, names)
    header = f"{meeting.title} ({meeting.started_at:%Y-%m-%d})\n"
    vectors = p.embedder.embed([header + c.text for c in chunks], kind="document") if chunks else []
    session.execute(delete(Chunk).where(Chunk.meeting_id == meeting.id))
    session.add_all(
        Chunk(
            meeting_id=meeting.id,
            start=c.start,
            end=c.end,
            speakers=", ".join(c.speakers)[:500],
            text=c.text,
            embedding=v,
        )
        for c, v in zip(chunks, vectors, strict=True)
    )
    session.commit()


def process_meeting(session: Session, meeting: Meeting, storage: Storage, p: Providers, settings: Settings) -> None:
    """Run the requested stage for one claimed meeting. Raises on failure; the caller records it.

    full: audio -> transcript -> summary -> index.  summarize: summary -> index (after renames).
    index: re-embed only (after changing the embedding model).
    """
    if meeting.local_only:
        remote = third_party_providers(settings)
        if remote:
            raise ProviderError(
                "this meeting is marked local-only, but these settings would send it to a third party: "
                + ", ".join(remote)
            )
    stage = meeting.requested_stage
    if stage == "full":
        transcribe_audio(session, meeting, storage, p, settings)
    if stage in ("full", "summarize"):
        summarize(session, meeting, p, settings)
    index(session, meeting, p)
    meeting.status = MeetingStatus.DONE
    meeting.stage = None
    meeting.error = None
    meeting.processed_at = utcnow()
    session.commit()


def claim_next(session: Session) -> Meeting | None:
    """Take the oldest queued meeting. SKIP LOCKED makes this safe with several workers.

    Claiming looks across all workspaces (system scope); the session is then narrowed to the
    meeting's own workspace for processing, so every row written belongs to it.
    """
    set_scope(session, SYSTEM)
    meeting = session.scalars(
        select(Meeting)
        .where(Meeting.status == MeetingStatus.QUEUED)
        .order_by(Meeting.updated_at)
        .limit(1)
        .with_for_update(skip_locked=True)
    ).first()
    if meeting is None:
        session.rollback()
        return None
    meeting.status = MeetingStatus.PROCESSING
    meeting.attempts += 1
    meeting.error = None
    session.commit()
    set_scope(session, Scope(meeting.workspace_id, meeting.user_id))
    return meeting


def requeue_interrupted(session: Session) -> int:
    """At worker start, anything still 'processing' was cut off by a restart; queue it again."""
    result = session.execute(
        update(Meeting).where(Meeting.status == MeetingStatus.PROCESSING).values(status=MeetingStatus.QUEUED)
    )
    session.commit()
    return result.rowcount or 0


def purge_expired_audio(session: Session, storage: Storage, retention_days: int, now: datetime | None = None) -> int:
    """Delete audio older than the retention window. Transcripts, summaries and the index stay."""
    if retention_days <= 0:
        return 0
    cutoff = (now or datetime.now(UTC)) - timedelta(days=retention_days)
    meetings = session.scalars(
        select(Meeting).where(
            Meeting.started_at < cutoff,
            Meeting.audio_deleted_at.is_(None),
            Meeting.status.in_([MeetingStatus.DONE, MeetingStatus.FAILED]),
        )
    ).all()
    for m in meetings:
        for key in (m.audio_key, m.playback_key):
            if key:
                try:
                    storage.delete(key)
                except Exception:  # keep going; a missing file is fine
                    log.exception("could not delete %s", key)
        m.audio_key = None
        m.playback_key = None
        m.audio_deleted_at = utcnow()
    session.commit()
    return len(meetings)
