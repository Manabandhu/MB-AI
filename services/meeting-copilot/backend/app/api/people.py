"""People and opt-in voiceprints.

Voiceprints are biometric data (Illinois BIPA, Texas CUBI): enrollment needs that person's explicit
consent, only the embedding is stored (the clips are deleted as soon as they are embedded), and
anyone in the workspace can delete a voiceprint at any time.
"""

import tempfile
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from ..auth import Principal, audit, current_principal, get_db
from ..models import Meeting, Person, Segment, Speaker, Voiceprint, utcnow
from ..pipeline import audio
from ..pipeline.people import find_person
from ..providers import ProviderError, get_speaker_embedder
from ..providers.voiceprint import embed_spans, mean_embedding
from ..storage import get_storage

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])

MIN_CLIP_S = 3.0
MAX_CLIPS = 5


class PersonOut(BaseModel):
    id: str
    display_name: str
    email: str | None
    aliases: list[str]
    is_you: bool
    has_voiceprint: bool
    consent_at: datetime | None
    voiceprint_seconds: float
    meetings: int
    last_seen: datetime | None


class PersonCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=320)
    aliases: list[str] = Field(default_factory=list)


class PersonUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: str | None = Field(default=None, max_length=320)
    aliases: list[str] | None = None


class ClusterEnroll(BaseModel):
    person_id: str
    consent: bool = False  # the person agreed to have a voiceprint saved


def _out(db: Session, p: Person, principal: Principal) -> PersonOut:
    vps = db.scalars(select(Voiceprint).where(Voiceprint.person_id == p.id)).all()
    seen = db.execute(
        select(func.count(func.distinct(Speaker.meeting_id)), func.max(Meeting.started_at))
        .join(Meeting, Meeting.id == Speaker.meeting_id)
        .where(Speaker.person_id == p.id)
    ).one()
    return PersonOut(
        id=p.id,
        display_name=p.display_name,
        email=p.email,
        aliases=p.aliases or [],
        is_you=p.account_user_id == principal.user_id,
        has_voiceprint=bool(vps),
        consent_at=p.consent_at,
        voiceprint_seconds=round(sum(v.seconds for v in vps), 1),
        meetings=seen[0] or 0,
        last_seen=seen[1],
    )


def _person(db: Session, person_id: str) -> Person:
    p = db.get(Person, person_id)
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "person not found")
    return p


def _clean(items: list[str]) -> list[str]:
    return list(dict.fromkeys(a.strip() for a in items if a.strip()))[:20]


@router.get("/people", response_model=list[PersonOut])
def list_people(db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    people = db.scalars(select(Person).order_by(Person.display_name)).all()
    return [_out(db, p, principal) for p in people]


@router.post("/people", response_model=PersonOut, status_code=status.HTTP_201_CREATED)
def create_person(body: PersonCreate, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    if find_person(db, body.display_name, body.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "someone with that name or email already exists")
    p = Person(
        display_name=body.display_name.strip(),
        email=(body.email or "").strip().lower() or None,
        aliases=_clean(body.aliases),
    )
    db.add(p)
    db.commit()
    return _out(db, p, principal)


@router.patch("/people/{person_id}", response_model=PersonOut)
def update_person(
    person_id: str, body: PersonUpdate, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    p = _person(db, person_id)
    if body.display_name is not None:
        p.display_name = body.display_name.strip()
        db.execute(update(Speaker).where(Speaker.person_id == p.id).values(display_name=p.display_name))
    if body.email is not None:
        p.email = body.email.strip().lower() or None
    if body.aliases is not None:
        p.aliases = _clean(body.aliases)
    db.commit()
    return _out(db, p, principal)


@router.delete("/people/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(
    person_id: str, request: Request, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    p = _person(db, person_id)
    if p.account_user_id:
        raise HTTPException(422, "this person is an app user; remove them from the workspace instead")
    audit(db, principal, "person_delete", "person", p.id, request, name=p.display_name)
    db.delete(p)
    db.commit()


# ---------------------------------------------------------------------------------- voiceprints


def _embed_upload(upload: UploadFile, tmp: Path, i: int) -> tuple[list[float], float]:
    suffix = Path(upload.filename or "").suffix.lower() or ".webm"
    raw = tmp / f"upload{i}{suffix}"
    raw.write_bytes(upload.file.read())
    wav = tmp / f"clip{i}.wav"
    try:
        seconds = audio.normalize(raw, wav, channels=1)
    except audio.AudioError as e:
        raise HTTPException(422, f"clip {i + 1} is not readable audio") from e
    finally:
        raw.unlink(missing_ok=True)
    if seconds < MIN_CLIP_S:
        raise HTTPException(422, f"clip {i + 1} is {seconds:.1f}s; record at least {MIN_CLIP_S:.0f}s of speech")
    vecs = embed_spans(get_speaker_embedder(), wav, [(0.0, seconds)])
    wav.unlink(missing_ok=True)
    if not vecs:
        raise HTTPException(422, f"clip {i + 1} has no speech in it")
    return vecs[0], seconds


@router.post("/people/{person_id}/voiceprint", response_model=PersonOut)
def enroll_voiceprint(
    person_id: str,
    request: Request,
    clips: list[UploadFile] = File(...),
    consent: bool = Form(False),
    db: Session = Depends(get_db),
    principal: Principal = Depends(current_principal),
):
    """About 30 seconds of read speech in up to three clips. Replaces any earlier voiceprint."""
    if not consent:
        raise HTTPException(422, "a voiceprint needs the person's explicit consent")
    if not 1 <= len(clips) <= MAX_CLIPS:
        raise HTTPException(422, f"send between 1 and {MAX_CLIPS} clips")
    p = _person(db, person_id)
    embedder = get_speaker_embedder()
    try:
        with tempfile.TemporaryDirectory(prefix="enroll-") as tmp_dir:  # deleted with its audio on exit
            results = [_embed_upload(c, Path(tmp_dir), i) for i, c in enumerate(clips)]
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    db.execute(delete(Voiceprint).where(Voiceprint.person_id == p.id))
    db.add(
        Voiceprint(
            person_id=p.id,
            embedding=mean_embedding([v for v, _s in results]),
            model=embedder.name,
            clips=len(results),
            seconds=round(sum(s for _v, s in results), 1),
        )
    )
    p.consent_at = utcnow()
    audit(db, principal, "voiceprint_enroll", "person", p.id, request, clips=len(results))
    db.commit()
    return _out(db, p, principal)


@router.delete("/people/{person_id}/voiceprint", response_model=PersonOut)
def delete_voiceprint(
    person_id: str, request: Request, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    p = _person(db, person_id)
    db.execute(delete(Voiceprint).where(Voiceprint.person_id == p.id))
    p.consent_at = None
    audit(db, principal, "voiceprint_delete", "person", p.id, request)
    db.commit()
    return _out(db, p, principal)


@router.post("/meetings/{meeting_id}/speakers/{label}/enroll", response_model=PersonOut)
def enroll_from_meeting(
    meeting_id: str,
    label: str,
    body: ClusterEnroll,
    request: Request,
    db: Session = Depends(get_db),
    principal: Principal = Depends(current_principal),
):
    """Tag an unknown speaker once. With their consent, their turns in this meeting become a voiceprint."""
    if not body.consent:
        raise HTTPException(422, "a voiceprint needs the person's explicit consent")
    m = db.get(Meeting, meeting_id)
    speaker = db.scalars(select(Speaker).where(Speaker.meeting_id == meeting_id, Speaker.label == label)).first()
    if m is None or speaker is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "speaker not found")
    if not m.audio_key:
        raise HTTPException(status.HTTP_409_CONFLICT, "this meeting's audio was removed by the retention policy")
    p = _person(db, body.person_id)
    spans = [
        (s.start, s.end)
        for s in db.scalars(
            select(Segment).where(Segment.meeting_id == meeting_id, Segment.speaker_label == label)
        ).all()
    ]
    if sum(e - s for s, e in spans) < MIN_CLIP_S:
        raise HTTPException(422, "this speaker talks for too little time to build a voiceprint")
    embedder = get_speaker_embedder()
    with tempfile.TemporaryDirectory(prefix="enroll-") as tmp_dir:
        tmp = Path(tmp_dir)
        src = tmp / ("source" + Path(m.audio_key).suffix)
        get_storage().get_file(m.audio_key, src)
        stereo = m.channel_layout == "mic_system" and audio.source_channels(src) >= 2
        norm = tmp / "norm.wav"
        audio.normalize(src, norm, channels=2 if stereo else 1)
        wav = norm
        if stereo:
            mic, system = tmp / "mic.wav", tmp / "system.wav"
            audio.split_stereo(norm, mic, system)
            wav = mic if speaker.is_owner else system
        try:
            longest = sorted(spans, key=lambda x: x[1] - x[0], reverse=True)[:20]
            vec = mean_embedding(embed_spans(embedder, wav, longest))
        except ProviderError as e:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    if vec is None:
        raise HTTPException(422, "no usable speech for this speaker")
    db.execute(delete(Voiceprint).where(Voiceprint.person_id == p.id))
    db.add(
        Voiceprint(
            person_id=p.id,
            embedding=vec,
            model=embedder.name,
            clips=len(spans),
            seconds=round(sum(e - s for s, e in spans), 1),
        )  # fmt: skip
    )
    p.consent_at = utcnow()
    speaker.person_id, speaker.display_name, speaker.match_source = p.id, p.display_name, "manual"
    audit(db, principal, "voiceprint_enroll", "person", p.id, request, meeting_id=meeting_id, label=label)
    db.commit()
    return _out(db, p, principal)
