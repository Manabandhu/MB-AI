import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse, PlainTextResponse, RedirectResponse
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from ..auth import Principal, audit, current_principal, get_db, require_token, sign_media, verify_media
from ..config import get_settings
from ..db import SYSTEM, get_system_db, new_session
from ..models import (
    ActionItem,
    Commitment,
    CommitmentStatus,
    Meeting,
    MeetingStatus,
    Person,
    Segment,
    Speaker,
    SpeakerCorrection,
    User,
    utcnow,
)
from ..pipeline.export import meeting_json, meeting_markdown
from ..pipeline.memory import forget_meeting
from ..pipeline.people import ensure_person
from ..pipeline.platform import parse_vtt
from ..pipeline.process import save_transcript
from ..pipeline.profiles import AUTO, detect_profile, profile_exists
from ..pipeline.transcript import OWNER_LABEL, Line, relabel_with_map
from ..schemas import (
    ActionItemOut,
    ActionItemUpdate,
    ConsentRequest,
    MeetingCreate,
    MeetingDetail,
    MeetingListItem,
    MeetingUpdate,
    ReprocessRequest,
    SegmentOut,
    SegmentUpdate,
    SpeakerMerge,
    SpeakerOut,
    SpeakerUpdate,
    SummaryUpdate,
    TranscriptImport,
)
from ..storage import get_storage
from .memory import set_commitment_status

router = APIRouter(prefix="/api", dependencies=[Depends(require_token)])
media_router = APIRouter(prefix="/api")  # signed links, no bearer header (used by <audio src>)

ALLOWED_AUDIO = {".wav", ".flac", ".mp3", ".m4a", ".mp4", ".webm", ".ogg", ".opus", ".aac"}


def _get(db: Session, meeting_id: str, *, detail: bool = False) -> Meeting:
    stmt = select(Meeting).where(Meeting.id == meeting_id)
    if detail:
        stmt = stmt.options(
            selectinload(Meeting.speakers),
            selectinload(Meeting.segments),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
        )
    meeting = db.scalars(stmt).first()
    if meeting is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "meeting not found")
    return meeting


def _speaker_order(s: Speaker) -> tuple[bool, int, str]:
    """You first, then S1, S2 ... S10 in numeric order."""
    num = int(s.label[1:]) if s.label[1:].isdigit() else 10_000
    return (not s.is_owner, num, s.label)


def _detail(m: Meeting) -> MeetingDetail:
    return MeetingDetail(
        id=m.id,
        user_id=m.user_id,
        title=m.title,
        profile=m.profile,
        started_at=m.started_at,
        duration_s=m.duration_s,
        status=m.status,
        stage=m.stage,
        error=m.error,
        overview=(m.summary.data.get("overview") if m.summary else None),
        open_action_items=sum(1 for a in m.action_items if not a.done),
        attendees=m.attendees or [],
        channel_layout=m.channel_layout,
        consent_confirmed=m.consent_confirmed,
        consent_state=m.consent_state,
        consent_log=m.consent_log or [],
        source=m.source,
        local_only=m.local_only,
        off_record=m.off_record or [],
        links=m.links or [],
        calendar_event_id=m.calendar_event_id,
        profile_source=m.profile_source,
        bot_id=m.bot_id,
        bot_status=m.bot_status,
        meeting_url=m.meeting_url,
        platform_labels=bool(m.platform_turns),
        processed_at=m.processed_at,
        has_audio=bool(m.playback_key),
        audio_deleted_at=m.audio_deleted_at,
        speakers=[SpeakerOut.model_validate(s) for s in sorted(m.speakers, key=_speaker_order)],
        segments=[SegmentOut.model_validate(s) for s in m.segments],
        summary=m.summary.data if m.summary else None,
        summary_model=m.summary.model if m.summary else None,
        action_items=[ActionItemOut.model_validate(a) for a in m.action_items],
    )


def _check_profile(db: Session, profile: str) -> None:
    if not profile_exists(profile, db):
        raise HTTPException(422, f"unknown profile '{profile}'")


def record_consent(m: Meeting, method: str, principal: Principal, note: str = "") -> None:
    """All-party consent is a launch blocker: log how it was given, on the meeting row."""
    m.consent_confirmed = True
    m.consent_state = "confirmed"
    entry = {"method": method, "at": utcnow().isoformat(), "by": principal.display_name}
    if note:
        entry["note"] = note
    m.consent_log = [*(m.consent_log or []), entry]


def require_consent(m: Meeting) -> None:
    if m.consent_state != "confirmed":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "consent has not been confirmed for this meeting; everyone must be told it is being recorded",
        )


def _ensure_idle(m: Meeting) -> None:
    if m.status in (MeetingStatus.QUEUED, MeetingStatus.PROCESSING, MeetingStatus.LIVE):
        raise HTTPException(status.HTTP_409_CONFLICT, "this meeting is being processed; try again when it finishes")


@router.get("/meetings", response_model=list[MeetingListItem])
def list_meetings(
    db: Session = Depends(get_db),
    q: str | None = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    stmt = select(Meeting).options(selectinload(Meeting.summary), selectinload(Meeting.action_items))
    if q:
        stmt = stmt.where(Meeting.title.ilike(f"%{q}%"))
    meetings = db.scalars(stmt.order_by(Meeting.started_at.desc()).limit(limit).offset(offset)).all()
    return [
        MeetingListItem(
            id=m.id,
            user_id=m.user_id,
            title=m.title,
            profile=m.profile,
            started_at=m.started_at,
            duration_s=m.duration_s,
            status=m.status,
            stage=m.stage,
            error=m.error,
            overview=(m.summary.data.get("overview") if m.summary else None),
            open_action_items=sum(1 for a in m.action_items if not a.done),
        )
        for m in meetings
    ]


@router.post("/meetings", response_model=MeetingDetail, status_code=status.HTTP_201_CREATED)
def create_meeting(
    body: MeetingCreate, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    _check_profile(db, body.profile)
    profile, profile_source = body.profile, "user"
    if profile == AUTO:
        profile, _confidence = detect_profile(body.title, body.attendees, session=db)
        profile_source = "auto"
    meeting = Meeting(
        title=body.title.strip(),
        profile=profile,
        profile_source=profile_source,
        started_at=body.started_at or utcnow(),
        attendees=[a.strip() for a in body.attendees if a.strip()],
        channel_layout=body.channel_layout,
        source=body.source,
        local_only=body.local_only,
        links=[link.model_dump() for link in body.links],
        calendar_event_id=body.calendar_event_id,
        meeting_url=body.meeting_url,
        consent_log=[],
    )
    if body.consent_confirmed:
        record_consent(meeting, body.consent_method, principal)
    db.add(meeting)
    db.commit()
    return _detail(_get(db, meeting.id, detail=True))


@router.get("/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(
    meeting_id: str, request: Request, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    detail = _detail(_get(db, meeting_id, detail=True))
    audit(db, principal, "view", "meeting", meeting_id, request)
    db.commit()
    return detail


@router.post("/meetings/{meeting_id}/consent", response_model=MeetingDetail)
def confirm_consent(
    meeting_id: str, body: ConsentRequest, db: Session = Depends(get_db),
    principal: Principal = Depends(current_principal),
):  # fmt: skip
    m = _get(db, meeting_id)
    record_consent(m, body.method, principal, body.note)
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.get("/meetings/{meeting_id}/export")
def export_meeting(
    meeting_id: str, request: Request, format: str = Query("md", pattern="^(md|json)$"),
    db: Session = Depends(get_db), principal: Principal = Depends(current_principal),
):  # fmt: skip
    m = _get(db, meeting_id, detail=True)
    audit(db, principal, "export", "meeting", meeting_id, request, format=format)
    db.commit()
    if format == "json":
        return meeting_json(m)
    return PlainTextResponse(
        meeting_markdown(m),
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="meeting-{m.id[:8]}.md"'},
    )


@router.patch("/meetings/{meeting_id}", response_model=MeetingDetail)
def update_meeting(meeting_id: str, body: MeetingUpdate, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    if body.title is not None:
        m.title = body.title.strip()
    if body.profile is not None:
        _check_profile(db, body.profile)
        m.profile = body.profile
        m.profile_source = "user"
    if body.attendees is not None:
        m.attendees = [a.strip() for a in body.attendees if a.strip()]
    if body.links is not None:
        m.links = [link.model_dump() for link in body.links]
    if body.local_only is not None:
        m.local_only = body.local_only
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.delete("/meetings/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: str, request: Request, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    m = _get(db, meeting_id)
    _ensure_idle(m)
    storage = get_storage()
    for key in (m.audio_key, m.playback_key):
        if key:
            storage.delete(key)
    audit(db, principal, "delete", "meeting", meeting_id, request, title=m.title)
    forget_meeting(db, m)
    db.delete(m)
    db.commit()


@router.put("/meetings/{meeting_id}/audio", response_model=MeetingDetail)
def upload_audio(meeting_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    _ensure_idle(m)
    require_consent(m)
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_AUDIO:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"unsupported file type '{suffix}'; use one of {sorted(ALLOWED_AUDIO)}",
        )
    limit = get_settings().max_upload_mb * 1024 * 1024
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = Path(tmp.name)
        size = 0
        while chunk := file.file.read(1 << 20):
            size += len(chunk)
            if size > limit:
                tmp.close()
                tmp_path.unlink(missing_ok=True)
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "file is larger than MAX_UPLOAD_MB")
            tmp.write(chunk)
    try:
        if size == 0:
            raise HTTPException(422, "the uploaded file is empty")
        storage = get_storage()
        if m.audio_key and m.audio_key != f"{m.id}/source{suffix}":
            storage.delete(m.audio_key)
        m.audio_key = f"{m.id}/source{suffix}"
        storage.put_file(tmp_path, m.audio_key)
    finally:
        tmp_path.unlink(missing_ok=True)
    m.audio_deleted_at = None
    m.status = MeetingStatus.QUEUED
    m.requested_stage = "full"
    m.stage = "waiting for worker"
    m.error = None
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.post("/meetings/{meeting_id}/transcript", response_model=MeetingDetail)
def import_transcript(
    meeting_id: str, body: TranscriptImport, db: Session = Depends(get_db),
    principal: Principal = Depends(current_principal),
):  # fmt: skip
    """Bring a meeting in from text alone (e.g. a Teams transcript with no recording).

    Lines spoken by you (your display name) become the "me" speaker; everyone else is labelled by name.
    The summary, memory and search index are built by the worker as usual.
    """
    m = _get(db, meeting_id)
    _ensure_idle(m)
    require_consent(m)
    me = {principal.display_name.lower(), *(a.lower() for a in _aliases(principal))}
    raw = [
        Line(ln.start, ln.end if ln.end is not None else ln.start + 2.0,
             OWNER_LABEL if ln.speaker.strip().lower() in me else ln.speaker.strip(), ln.text.strip())
        for ln in sorted(body.lines, key=lambda x: x.start)
        if ln.text.strip()
    ]  # fmt: skip
    lines, mapping = relabel_with_map(raw)
    save_transcript(db, m, lines, get_settings(), platform_names={new: old for old, new in mapping.items()})
    m.duration_s = max((ln.end for ln in lines), default=0.0)
    m.status, m.requested_stage, m.stage, m.error = MeetingStatus.QUEUED, "summarize", "waiting for worker", None
    m.source = "upload"
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


def _aliases(principal: Principal) -> list[str]:
    with new_session(SYSTEM) as s:
        user = s.get(User, principal.user_id)
        return list(user.aliases or []) if user else []


@router.put("/meetings/{meeting_id}/platform-transcript", response_model=MeetingDetail)
def upload_platform_transcript(meeting_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """A Teams or Zoom transcript (.vtt). Its speaker names label the audio instead of diarization.

    Re-transcribe the meeting afterwards ("full") to apply it.
    """
    m = _get(db, meeting_id)
    _ensure_idle(m)
    raw = file.file.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "transcript files are limited to 5 MB")
    turns = parse_vtt(raw.decode("utf-8", errors="replace"))
    if not turns:
        raise HTTPException(422, "no speaker-labelled cues found; export the transcript as .vtt with speaker names")
    m.platform_turns = [{k: t[k] for k in ("start", "end", "speaker")} for t in turns]
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.post("/meetings/{meeting_id}/reprocess", response_model=MeetingDetail)
def reprocess(meeting_id: str, body: ReprocessRequest, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    _ensure_idle(m)
    if body.stage == "full" and not m.audio_key:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "no audio to re-transcribe (it may have passed the retention window)"
        )
    if body.stage in ("summarize", "index") and not db.scalar(
        select(func.count()).select_from(Segment).where(Segment.meeting_id == m.id)
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "there is no transcript to summarize yet")
    m.status = MeetingStatus.QUEUED
    m.requested_stage = body.stage
    m.stage = "waiting for worker"
    m.error = None
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


def _correction(db: Session, meeting_id: str, from_label: str, to_label: str, kind: str, n: int, seg=None) -> None:
    """Every fix is logged: it is how speaker accuracy is measured (GET /api/metrics/speakers)."""
    db.add(
        SpeakerCorrection(
            meeting_id=meeting_id,
            segment_id=seg,
            from_label=from_label,
            to_label=to_label,
            kind=kind,
            segments_affected=n,
        )  # fmt: skip
    )


def _label_count(db: Session, meeting_id: str, label: str) -> int:
    return db.scalar(
        select(func.count())
        .select_from(Segment)
        .where(Segment.meeting_id == meeting_id, Segment.speaker_label == label)
    )


@router.patch("/meetings/{meeting_id}/speakers/{label}", response_model=SpeakerOut)
def rename_speaker(meeting_id: str, label: str, body: SpeakerUpdate, db: Session = Depends(get_db)):
    """Name a speaker. The name is linked to the people directory (created if new)."""
    speaker = db.scalars(select(Speaker).where(Speaker.meeting_id == meeting_id, Speaker.label == label)).first()
    if speaker is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "speaker not found")
    if body.person_id is None and body.display_name is None:
        raise HTTPException(422, "give a display_name or a person_id")
    person = None
    if body.person_id:
        person = db.get(Person, body.person_id)
        if person is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "person not found")
    elif not speaker.is_owner:
        person = ensure_person(db, body.display_name.strip())
    new_person_id = person.id if person else speaker.person_id
    if speaker.match_source in ("voiceprint", "platform") and new_person_id != speaker.person_id:
        # The automatic label was wrong: every turn of this speaker was mislabelled.
        _correction(db, meeting_id, label, label, "person", _label_count(db, meeting_id, label))
    speaker.display_name = (body.display_name or person.display_name).strip()
    if person is not None and not speaker.is_owner:
        if speaker.person_id != person.id or speaker.match_source is None:
            speaker.match_source = "manual"  # a confirmed voiceprint/platform match keeps its source
        speaker.person_id = person.id
    db.commit()
    return speaker


@router.post("/meetings/{meeting_id}/speakers/merge", response_model=MeetingDetail)
def merge_speakers(meeting_id: str, body: SpeakerMerge, db: Session = Depends(get_db)):
    """Diarization sometimes splits one person into two labels; fold one into the other."""
    m = _get(db, meeting_id)
    _ensure_idle(m)
    if body.from_label == body.into_label:
        raise HTTPException(422, "pick two different speakers")
    labels = {s.label: s for s in db.scalars(select(Speaker).where(Speaker.meeting_id == meeting_id)).all()}
    if body.from_label not in labels or body.into_label not in labels:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "speaker not found")
    n = _label_count(db, meeting_id, body.from_label)
    db.execute(
        update(Segment)
        .where(Segment.meeting_id == meeting_id, Segment.speaker_label == body.from_label)
        .values(speaker_label=body.into_label)
    )
    _correction(db, meeting_id, body.from_label, body.into_label, "merge", n)
    db.delete(labels[body.from_label])
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.patch("/meetings/{meeting_id}/segments/{segment_id}", response_model=MeetingDetail)
def fix_segment_speaker(meeting_id: str, segment_id: int, body: SegmentUpdate, db: Session = Depends(get_db)):
    """The fix-speaker tap: move one line to another speaker (or to a new one)."""
    m = _get(db, meeting_id)
    _ensure_idle(m)
    seg = db.get(Segment, segment_id)
    if seg is None or seg.meeting_id != meeting_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "line not found")
    speakers = {s.label: s for s in db.scalars(select(Speaker).where(Speaker.meeting_id == meeting_id)).all()}
    target = body.speaker_label
    if target == "new":
        nums = [int(lbl[1:]) for lbl in speakers if lbl[1:].isdigit()]
        target = f"S{max(nums, default=0) + 1}"
        db.add(Speaker(meeting_id=meeting_id, label=target, display_name=f"Speaker {target[1:]}", is_owner=False))
    elif target not in speakers:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "speaker not found")
    if target != seg.speaker_label:
        _correction(db, meeting_id, seg.speaker_label, target, "line", 1, seg=seg.id)
        old = seg.speaker_label
        seg.speaker_label = target
        db.flush()
        if old in speakers and not _label_count(db, meeting_id, old) and not speakers[old].is_owner:
            db.delete(speakers[old])
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.patch("/meetings/{meeting_id}/summary", response_model=MeetingDetail)
def edit_summary(meeting_id: str, body: SummaryUpdate, db: Session = Depends(get_db)):
    """Hand edits to a summary. Counted: the Phase 1 gate is at most one edit per standup."""
    m = _get(db, meeting_id, detail=True)
    if m.summary is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "this meeting has no summary yet")
    merged = {**m.summary.data, **body.data}
    m.summary.data = merged
    m.summary.edit_count = (m.summary.edit_count or 0) + 1
    m.summary.edited_at = utcnow()
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.get("/action-items", response_model=list[ActionItemOut])
def list_action_items(open_only: bool = True, limit: int = Query(100, le=500), db: Session = Depends(get_db)):
    stmt = select(ActionItem).join(Meeting).order_by(Meeting.started_at.desc(), ActionItem.id)
    if open_only:
        stmt = stmt.where(ActionItem.done.is_(False))
    return db.scalars(stmt.limit(limit)).all()


@router.patch("/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(item_id: int, body: ActionItemUpdate, db: Session = Depends(get_db)):
    item = db.get(ActionItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "action item not found")
    item.done = body.done
    if item.commitment_id:  # ticking it off anywhere closes the commitment everywhere
        c = db.get(Commitment, item.commitment_id)
        if c is not None:
            set_commitment_status(db, c, CommitmentStatus.DONE if body.done else CommitmentStatus.OPEN)
    db.commit()
    return item


@router.get("/meetings/{meeting_id}/audio-url")
def audio_url(
    meeting_id: str, request: Request, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    m = _get(db, meeting_id)
    if not m.playback_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no audio for this meeting")
    audit(db, principal, "listen", "meeting", meeting_id, request)
    db.commit()
    direct = get_storage().presigned_url(m.playback_key, 3600)
    if direct:
        return {"url": direct}
    exp, sig = sign_media(m.id)
    return {"url": f"/api/media/{m.id}?exp={exp}&sig={sig}"}


@media_router.get("/media/{meeting_id}")
def media(meeting_id: str, exp: int, sig: str, db: Session = Depends(get_system_db)):
    if not verify_media(meeting_id, exp, sig):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "link expired or invalid")
    m = _get(db, meeting_id)
    if not m.playback_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no audio for this meeting")
    storage = get_storage()
    path = storage.local_path(m.playback_key)
    if path is not None:
        return FileResponse(path, media_type="audio/mp4")
    url = storage.presigned_url(m.playback_key, 600)
    if url:
        return RedirectResponse(url)
    raise HTTPException(status.HTTP_404_NOT_FOUND, "audio file missing")
