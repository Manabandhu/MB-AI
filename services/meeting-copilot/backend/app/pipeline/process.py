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
from ..models import (
    ActionItem,
    Chunk,
    Entity,
    GlossaryTerm,
    Meeting,
    MeetingStatus,
    Person,
    Segment,
    Speaker,
    Summary,
    User,
    utcnow,
)
from ..privacy import maybe_redact, third_party_providers
from ..providers import LLM, Diarizer, Embedder, ProviderError, SpeakerEmbedder, Transcriber
from ..storage import Storage
from . import audio
from .chunking import chunk_lines
from .people import ensure_person, is_generic_name
from .platform import to_speaker_turns
from .profiles import get_profile
from .speakers import Match, identify_by_voiceprint
from .summarize import summarize_transcript
from .transcript import (
    OWNER_LABEL,
    Line,
    assign_speakers,
    drop_echo,
    format_transcript,
    merge_adjacent,
    relabel_with_map,
)

log = logging.getLogger(__name__)

SILENT_DBFS = -65.0  # a channel quieter than this over the whole recording is treated as empty


@dataclass
class Providers:
    stt: Transcriber
    diarizer: Diarizer
    llm: LLM
    embedder: Embedder
    voiceprints: SpeakerEmbedder | None = None


def _set_stage(session: Session, meeting: Meeting, stage: str) -> None:
    meeting.stage = stage
    session.commit()
    log.info("meeting %s: %s", meeting.id, stage)


def _diarized_lines(
    wav: Path, p: Providers, fallback: str, session: Session, meeting: Meeting, vocabulary: list[str]
) -> list[Line]:
    segments = p.stt.transcribe(wav, diarize=True, vocabulary=vocabulary)
    if meeting.platform_turns:  # bot or Teams labels: who spoke is known, no guessing needed
        return assign_speakers(segments, to_speaker_turns(meeting.platform_turns), fallback=fallback)
    turns = []
    if segments and not p.stt.returns_speakers:
        _set_stage(session, meeting, "diarizing")
        turns = p.diarizer.diarize(wav)
    return assign_speakers(segments, turns, fallback=fallback)


def transcribe_audio(session: Session, meeting: Meeting, storage: Storage, p: Providers, settings: Settings) -> None:
    if not meeting.audio_key:
        raise RuntimeError("this meeting has no audio (it may have been removed by the retention policy)")
    vocabulary = workspace_vocabulary(session)
    matches: dict[str, Match] = {}
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
        speaker_wav = norm
        if stereo:
            mic, system = tmp / "mic.wav", tmp / "system.wav"
            audio.split_stereo(norm, mic, system)
            speaker_wav = system
            mine: list[Line] = []
            if audio.rms_dbfs(mic) > SILENT_DBFS:
                mine = [
                    Line(s.start, s.end, OWNER_LABEL, s.text)
                    for s in p.stt.transcribe(mic, diarize=False, vocabulary=vocabulary)
                ]
            others: list[Line] = []
            if audio.rms_dbfs(system) > SILENT_DBFS:
                others = _diarized_lines(system, p, "others", session, meeting, vocabulary)
            lines = drop_echo(mine, others) + others
        else:
            lines = _diarized_lines(norm, p, "speaker", session, meeting, vocabulary)

        lines, mapping = relabel_with_map(lines)
        lines = merge_adjacent(lines)
        platform_names = {new: raw for raw, new in mapping.items()} if meeting.platform_turns else {}

        if not platform_names and p.voiceprints is not None and lines:
            _set_stage(session, meeting, "recognizing speakers")
            try:
                matches = identify_by_voiceprint(session, meeting, p.voiceprints, speaker_wav, lines, settings)
            except ProviderError as e:  # speaker recognition is best effort; numbered speakers still work
                log.warning("meeting %s: voiceprint matching skipped: %s", meeting.id, e)

    save_transcript(session, meeting, lines, settings, matches=matches, platform_names=platform_names)


def save_transcript(
    session: Session,
    meeting: Meeting,
    lines: list[Line],
    settings: Settings,
    *,
    matches: dict[str, Match] | None = None,
    platform_names: dict[str, str] | None = None,
) -> None:
    """Replace the meeting's speakers and segments. Lines carry final labels ("me", "S1", ...)."""
    matches, platform_names = matches or {}, platform_names or {}
    session.execute(delete(Segment).where(Segment.meeting_id == meeting.id))
    session.execute(delete(Speaker).where(Speaker.meeting_id == meeting.id))
    labels = list(dict.fromkeys(ln.speaker for ln in lines))
    if OWNER_LABEL in labels:
        labels.remove(OWNER_LABEL)
        labels.insert(0, OWNER_LABEL)
    owner_name = owner_display_name(session, meeting, settings)
    owner_person = self_person(session, meeting.user_id) if meeting.user_id else None
    for label in labels:
        sp = Speaker(meeting_id=meeting.id, label=label, display_name=f"Speaker {label[1:]}", is_owner=False)
        if label == OWNER_LABEL:
            sp.display_name, sp.is_owner, sp.match_source = owner_name, True, "owner"
            sp.person_id = owner_person.id if owner_person else None
        elif label in platform_names:
            sp.display_name, sp.match_source = platform_names[label][:120], "platform"
            person = ensure_person(session, platform_names[label])
            sp.person_id = person.id if person else None
        elif label in matches:
            m = matches[label]
            sp.display_name, sp.person_id = m.person.display_name, m.person.id
            sp.match_source, sp.match_score = "voiceprint", m.score
        session.add(sp)
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


def workspace_vocabulary(session: Session) -> list[str]:
    """Glossary terms, entity names and people's names: fed to STT as custom vocabulary."""
    terms = [t for (t,) in session.execute(select(GlossaryTerm.term)).all()]
    terms += [n for (n,) in session.execute(select(Entity.name).order_by(Entity.id.desc()).limit(60)).all()]
    terms += [n for (n,) in session.execute(select(Person.display_name).limit(60)).all()]
    return list(dict.fromkeys(t for t in terms if t and not is_generic_name(t)))[:120]


def self_person(session: Session, user_id: str) -> Person:
    """The Person row that is the given app user, in the session's workspace."""
    person = session.scalars(select(Person).where(Person.account_user_id == user_id)).first()
    if person is None:
        user = session.get(User, user_id)
        person = Person(display_name=user.display_name, email=user.email, account_user_id=user_id, aliases=[])
        session.add(person)
        session.flush()
    return person


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
