import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from ..auth import require_token, sign_media, verify_media
from ..config import get_settings
from ..db import get_db
from ..models import ActionItem, Meeting, MeetingStatus, Segment, Speaker, utcnow
from ..pipeline.profiles import PROFILES
from ..schemas import (
    ActionItemOut,
    ActionItemUpdate,
    MeetingCreate,
    MeetingDetail,
    MeetingListItem,
    MeetingUpdate,
    ReprocessRequest,
    SegmentOut,
    SpeakerMerge,
    SpeakerOut,
    SpeakerUpdate,
)
from ..storage import get_storage

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
        processed_at=m.processed_at,
        has_audio=bool(m.playback_key),
        audio_deleted_at=m.audio_deleted_at,
        speakers=[SpeakerOut.model_validate(s) for s in sorted(m.speakers, key=_speaker_order)],
        segments=[SegmentOut.model_validate(s) for s in m.segments],
        summary=m.summary.data if m.summary else None,
        summary_model=m.summary.model if m.summary else None,
        action_items=[ActionItemOut.model_validate(a) for a in m.action_items],
    )


def _check_profile(profile: str) -> None:
    if profile not in PROFILES:
        raise HTTPException(422, f"unknown profile '{profile}'")


def _ensure_idle(m: Meeting) -> None:
    if m.status in (MeetingStatus.QUEUED, MeetingStatus.PROCESSING):
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
def create_meeting(body: MeetingCreate, db: Session = Depends(get_db)):
    _check_profile(body.profile)
    meeting = Meeting(
        title=body.title.strip(),
        profile=body.profile,
        started_at=body.started_at or utcnow(),
        attendees=[a.strip() for a in body.attendees if a.strip()],
        channel_layout=body.channel_layout,
        consent_confirmed=body.consent_confirmed,
    )
    db.add(meeting)
    db.commit()
    return _detail(_get(db, meeting.id, detail=True))


@router.get("/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    return _detail(_get(db, meeting_id, detail=True))


@router.patch("/meetings/{meeting_id}", response_model=MeetingDetail)
def update_meeting(meeting_id: str, body: MeetingUpdate, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    if body.title is not None:
        m.title = body.title.strip()
    if body.profile is not None:
        _check_profile(body.profile)
        m.profile = body.profile
    if body.attendees is not None:
        m.attendees = [a.strip() for a in body.attendees if a.strip()]
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.delete("/meetings/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    _ensure_idle(m)
    storage = get_storage()
    for key in (m.audio_key, m.playback_key):
        if key:
            storage.delete(key)
    db.delete(m)
    db.commit()


@router.put("/meetings/{meeting_id}/audio", response_model=MeetingDetail)
def upload_audio(meeting_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    _ensure_idle(m)
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


@router.patch("/meetings/{meeting_id}/speakers/{label}", response_model=SpeakerOut)
def rename_speaker(meeting_id: str, label: str, body: SpeakerUpdate, db: Session = Depends(get_db)):
    speaker = db.scalars(select(Speaker).where(Speaker.meeting_id == meeting_id, Speaker.label == label)).first()
    if speaker is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "speaker not found")
    speaker.display_name = body.display_name.strip()
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
    db.execute(
        update(Segment)
        .where(Segment.meeting_id == meeting_id, Segment.speaker_label == body.from_label)
        .values(speaker_label=body.into_label)
    )
    db.delete(labels[body.from_label])
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
    db.commit()
    return item


@router.get("/meetings/{meeting_id}/audio-url")
def audio_url(meeting_id: str, request: Request, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    if not m.playback_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no audio for this meeting")
    direct = get_storage().presigned_url(m.playback_key, 3600)
    if direct:
        return {"url": direct}
    exp, sig = sign_media(m.id)
    return {"url": f"/api/media/{m.id}?exp={exp}&sig={sig}"}


@media_router.get("/media/{meeting_id}")
def media(meeting_id: str, exp: int, sig: str, db: Session = Depends(get_db)):
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
