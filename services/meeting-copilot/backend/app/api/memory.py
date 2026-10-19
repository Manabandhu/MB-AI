"""Meeting memory: commitments, decisions, entities, the glossary, custom profiles and documents."""

import re
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from ..auth import Principal, current_principal, get_db
from ..models import (
    ActionItem,
    Commitment,
    CommitmentMention,
    CommitmentStatus,
    CustomProfile,
    Decision,
    Document,
    Entity,
    EntityMention,
    GlossaryTerm,
    Meeting,
    Person,
    utcnow,
)
from ..pipeline.memory import is_overdue, is_stuck, resolve_due
from ..pipeline.profiles import PROFILES
from ..providers import ProviderError, get_embedder

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])


# ---------------------------------------------------------------------------------- commitments


class MentionOut(BaseModel):
    meeting_id: str
    meeting_title: str
    said_at: datetime
    at: float | None
    kind: str


class CommitmentOut(BaseModel):
    id: int
    owner: str | None
    owner_person_id: str | None
    text: str
    due: str | None
    due_date: date | None
    status: str
    stuck: bool
    overdue: bool
    mine: bool
    first_mentioned_at: datetime
    last_mentioned_at: datetime
    mention_count: int
    done_at: datetime | None
    jira_key: str | None
    mentions: list[MentionOut]


class CommitmentUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(open|done|dropped)$")
    text: str | None = Field(default=None, min_length=1)
    due: str | None = None
    owner: str | None = None


def _my_person_ids(db: Session, principal: Principal) -> set[str]:
    return {p.id for p in db.scalars(select(Person).where(Person.account_user_id == principal.user_id))}


def commitment_out(db: Session, c: Commitment, mine_ids: set[str], owner_name: str, now: datetime) -> CommitmentOut:
    rows = db.execute(
        select(CommitmentMention, Meeting.title)
        .join(Meeting, Meeting.id == CommitmentMention.meeting_id)
        .where(CommitmentMention.commitment_id == c.id)
        .order_by(CommitmentMention.said_at)
    ).all()
    return CommitmentOut(
        id=c.id,
        owner=c.owner,
        owner_person_id=c.owner_person_id,
        text=c.text,
        due=c.due,
        due_date=c.due_date,
        status=c.status,
        stuck=is_stuck(c, now),
        overdue=is_overdue(c, now.date()),
        mine=(c.owner_person_id in mine_ids) or ((c.owner or "").lower() == owner_name.lower()),
        first_mentioned_at=c.first_mentioned_at,
        last_mentioned_at=c.last_mentioned_at,
        mention_count=c.mention_count,
        done_at=c.done_at,
        jira_key=c.jira_key,
        mentions=[
            MentionOut(meeting_id=m.meeting_id, meeting_title=t, said_at=m.said_at, at=m.at, kind=m.kind)
            for m, t in rows
        ],
    )


def list_commitment_rows(
    db: Session, principal: Principal, status_filter: str = "open", owner: str | None = None, mine: bool = False,
    limit: int = 200, now: datetime | None = None,
) -> list[CommitmentOut]:  # fmt: skip
    now = now or datetime.now(UTC)
    stmt = select(Commitment).order_by(Commitment.last_mentioned_at.desc())
    if status_filter in ("open", "stuck", "overdue"):
        stmt = stmt.where(Commitment.status == CommitmentStatus.OPEN)
    elif status_filter in ("done", "dropped"):
        stmt = stmt.where(Commitment.status == status_filter)
    if owner:
        stmt = stmt.where(func.lower(Commitment.owner) == owner.lower())
    mine_ids = _my_person_ids(db, principal)
    out = []
    for c in db.scalars(stmt.limit(1000)):
        row = commitment_out(db, c, mine_ids, principal.display_name, now)
        if status_filter == "stuck" and not row.stuck:
            continue
        if status_filter == "overdue" and not row.overdue:
            continue
        if mine and not row.mine:
            continue
        out.append(row)
        if len(out) >= limit:
            break
    return out


@router.get("/commitments", response_model=list[CommitmentOut])
def list_commitments(
    status_filter: str = Query("open", alias="status", pattern="^(open|done|dropped|stuck|overdue|all)$"),
    owner: str | None = None,
    mine: bool = False,
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
    principal: Principal = Depends(current_principal),
):
    """Who owes what, across meetings. `stuck`: carried over three days or more without being done."""
    return list_commitment_rows(db, principal, status_filter, owner, mine, limit)


def set_commitment_status(db: Session, c: Commitment, new_status: str) -> None:
    c.status = new_status
    c.done_at = utcnow() if new_status == CommitmentStatus.DONE else None
    db.execute(
        update(ActionItem).where(ActionItem.commitment_id == c.id).values(done=new_status == CommitmentStatus.DONE)
    )


@router.patch("/commitments/{commitment_id}", response_model=CommitmentOut)
def update_commitment(
    commitment_id: int, body: CommitmentUpdate, db: Session = Depends(get_db),
    principal: Principal = Depends(current_principal),
):  # fmt: skip
    c = db.get(Commitment, commitment_id)
    if c is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "commitment not found")
    if body.status is not None:
        set_commitment_status(db, c, body.status)
    if body.text is not None:
        c.text = body.text.strip()
    if body.due is not None:
        c.due = body.due.strip() or None
        c.due_date = resolve_due(c.due, c.last_mentioned_at.date())
    if body.owner is not None:
        c.owner = body.owner.strip() or None
    db.commit()
    return commitment_out(db, c, _my_person_ids(db, principal), principal.display_name, datetime.now(UTC))


# ------------------------------------------------------------------------------------ decisions


class DecisionOut(BaseModel):
    id: int
    meeting_id: str
    meeting_title: str
    text: str
    owner: str | None
    decided_at: datetime
    at: float | None


@router.get("/decisions", response_model=list[DecisionOut])
def list_decisions(
    q: str | None = None, entity_id: int | None = None, since: date | None = None,
    limit: int = Query(100, le=500), db: Session = Depends(get_db),
):  # fmt: skip
    stmt = select(Decision, Meeting.title).join(Meeting, Meeting.id == Decision.meeting_id)
    if q:
        stmt = stmt.where(Decision.text.ilike(f"%{q}%"))
    if entity_id:
        stmt = stmt.where(
            Decision.meeting_id.in_(select(EntityMention.meeting_id).where(EntityMention.entity_id == entity_id))
        )
    if since:
        stmt = stmt.where(Decision.decided_at >= datetime.combine(since, datetime.min.time(), tzinfo=UTC))
    rows = db.execute(stmt.order_by(Decision.decided_at.desc()).limit(limit)).all()
    return [
        DecisionOut(
            id=d.id,
            meeting_id=d.meeting_id,
            meeting_title=t,
            text=d.text,
            owner=d.owner,
            decided_at=d.decided_at,
            at=d.at,
        )  # fmt: skip
        for d, t in rows
    ]


# ------------------------------------------------------------------------------------- entities


class EntityOut(BaseModel):
    id: int
    kind: str
    name: str
    aliases: list[str]
    meetings: int
    mentions: int
    last_seen: datetime | None


class EntityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    kind: str | None = Field(default=None, pattern="^(project|system|org|topic)$")
    aliases: list[str] | None = None


class EntityMerge(BaseModel):
    from_id: int
    into_id: int


class EntityMeeting(BaseModel):
    meeting_id: str
    title: str
    started_at: datetime
    first_at: float | None
    count: int


class EntityDetail(EntityOut):
    recent_meetings: list[EntityMeeting]
    decisions: list[DecisionOut]


def _entity_out(db: Session, e: Entity) -> EntityOut:
    total = func.coalesce(func.sum(EntityMention.count), 0)
    meetings, mentions, last = db.execute(
        select(func.count(EntityMention.id), total, func.max(Meeting.started_at))
        .join(Meeting, Meeting.id == EntityMention.meeting_id)
        .where(EntityMention.entity_id == e.id)
    ).one()
    return EntityOut(
        id=e.id, kind=e.kind, name=e.name, aliases=e.aliases or [], meetings=meetings, mentions=int(mentions),
        last_seen=last,
    )  # fmt: skip


@router.get("/entities", response_model=list[EntityOut])
def list_entities(kind: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Entity).order_by(Entity.name)
    if kind:
        stmt = stmt.where(Entity.kind == kind)
    rows = [_entity_out(db, e) for e in db.scalars(stmt)]
    return sorted(rows, key=lambda r: (r.last_seen is None, -(r.last_seen.timestamp() if r.last_seen else 0)))


def _entity(db: Session, entity_id: int) -> Entity:
    e = db.get(Entity, entity_id)
    if e is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "entity not found")
    return e


@router.get("/entities/{entity_id}", response_model=EntityDetail)
def get_entity(entity_id: int, db: Session = Depends(get_db)):
    e = _entity(db, entity_id)
    rows = db.execute(
        select(EntityMention, Meeting)
        .join(Meeting, Meeting.id == EntityMention.meeting_id)
        .where(EntityMention.entity_id == e.id)
        .order_by(Meeting.started_at.desc())
        .limit(20)
    ).all()
    return EntityDetail(
        **_entity_out(db, e).model_dump(),
        recent_meetings=[
            EntityMeeting(meeting_id=m.id, title=m.title, started_at=m.started_at, first_at=em.first_at, count=em.count)
            for em, m in rows
        ],
        decisions=list_decisions(entity_id=e.id, limit=20, db=db, q=None, since=None),
    )


@router.patch("/entities/{entity_id}", response_model=EntityOut)
def update_entity(entity_id: int, body: EntityUpdate, db: Session = Depends(get_db)):
    e = _entity(db, entity_id)
    if body.name is not None:
        e.name = body.name.strip()
    if body.kind is not None:
        e.kind = body.kind
    if body.aliases is not None:
        e.aliases = list(dict.fromkeys(a.strip() for a in body.aliases if a.strip()))
    db.commit()
    return _entity_out(db, e)


@router.post("/entities/merge", response_model=EntityOut)
def merge_entities(body: EntityMerge, db: Session = Depends(get_db)):
    """Entity resolution by hand: "Payments API" and "pay-api" are the same system."""
    if body.from_id == body.into_id:
        raise HTTPException(422, "pick two different entities")
    src, dst = _entity(db, body.from_id), _entity(db, body.into_id)
    for em in db.scalars(select(EntityMention).where(EntityMention.entity_id == src.id)).all():
        existing = db.scalars(
            select(EntityMention).where(EntityMention.entity_id == dst.id, EntityMention.meeting_id == em.meeting_id)
        ).first()
        if existing:
            existing.count += em.count
            db.delete(em)
        else:
            em.entity_id = dst.id
    dst.aliases = list(dict.fromkeys([*(dst.aliases or []), src.name, *(src.aliases or [])]))
    db.flush()
    db.delete(src)
    db.commit()
    return _entity_out(db, dst)


# ------------------------------------------------------------------------------------- glossary


class GlossaryIn(BaseModel):
    term: str = Field(min_length=1, max_length=200)
    kind: str = Field(default="term", pattern="^(term|project|system|org|topic)$")
    definition: str | None = None
    aliases: list[str] = Field(default_factory=list)
    watched: bool = False


class GlossaryOut(GlossaryIn):
    id: int


@router.get("/glossary", response_model=list[GlossaryOut])
def list_glossary(db: Session = Depends(get_db)):
    terms = db.scalars(select(GlossaryTerm).order_by(GlossaryTerm.term))
    return [GlossaryOut.model_validate(g, from_attributes=True) for g in terms]


@router.post("/glossary", response_model=GlossaryOut, status_code=status.HTTP_201_CREATED)
def add_glossary(body: GlossaryIn, db: Session = Depends(get_db)):
    """Team vocabulary. Feeds STT custom vocabulary, entity resolution, watched keywords and explain cards."""
    if db.scalars(select(GlossaryTerm).where(func.lower(GlossaryTerm.term) == body.term.strip().lower())).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "that term is already in the glossary")
    g = GlossaryTerm(**(body.model_dump() | {"term": body.term.strip()}))
    db.add(g)
    db.commit()
    return GlossaryOut.model_validate(g, from_attributes=True)


@router.put("/glossary/{term_id}", response_model=GlossaryOut)
def update_glossary(term_id: int, body: GlossaryIn, db: Session = Depends(get_db)):
    g = db.get(GlossaryTerm, term_id)
    if g is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "term not found")
    for k, v in body.model_dump().items():
        setattr(g, k, v.strip() if isinstance(v, str) else v)
    db.commit()
    return GlossaryOut.model_validate(g, from_attributes=True)


@router.delete("/glossary/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_glossary(term_id: int, db: Session = Depends(get_db)):
    db.execute(delete(GlossaryTerm).where(GlossaryTerm.id == term_id))
    db.commit()


# ------------------------------------------------------------------------------ custom profiles


class FieldIn(BaseModel):
    key: str = Field(pattern=r"^[a-z][a-z0-9_]{0,39}$")
    label: str = Field(min_length=1, max_length=80)
    hint: str = Field(default="", max_length=300)
    type: str = Field(default="list", pattern="^(list|text)$")


class ProfileIn(BaseModel):
    key: str = Field(pattern=r"^[a-z][a-z0-9_]{1,39}$")
    label: str = Field(min_length=1, max_length=120)
    instructions: str = Field(min_length=10, max_length=4000)
    fields: list[FieldIn] = Field(default_factory=list, max_length=12)
    live_prompt: str = Field(default="", max_length=2000)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    per_person: bool = False


class ProfileOut(ProfileIn):
    id: int


@router.get("/profiles/custom", response_model=list[ProfileOut])
def list_custom_profiles(db: Session = Depends(get_db)):
    return [ProfileOut.model_validate(p, from_attributes=True) for p in db.scalars(select(CustomProfile))]


@router.post("/profiles/custom", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
def create_custom_profile(body: ProfileIn, db: Session = Depends(get_db)):
    """A custom meeting type: a summary prompt plus a field list (and an optional live-assist prompt)."""
    if body.key in PROFILES or body.key == "auto":
        raise HTTPException(status.HTTP_409_CONFLICT, f"'{body.key}' is a built-in profile")
    if db.scalars(select(CustomProfile).where(CustomProfile.key == body.key)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "a profile with that key exists")
    p = CustomProfile(**body.model_dump(exclude={"fields"}), fields=[f.model_dump() for f in body.fields])
    db.add(p)
    db.commit()
    return ProfileOut.model_validate(p, from_attributes=True)


@router.put("/profiles/custom/{key}", response_model=ProfileOut)
def update_custom_profile(key: str, body: ProfileIn, db: Session = Depends(get_db)):
    p = db.scalars(select(CustomProfile).where(CustomProfile.key == key)).first()
    if p is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "profile not found")
    for k, v in body.model_dump(exclude={"fields", "key"}).items():
        setattr(p, k, v)
    p.fields = [f.model_dump() for f in body.fields]
    db.commit()
    return ProfileOut.model_validate(p, from_attributes=True)


@router.delete("/profiles/custom/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_profile(key: str, db: Session = Depends(get_db)):
    """Meetings that used it keep their summaries (the field labels are stored with each summary)."""
    db.execute(delete(CustomProfile).where(CustomProfile.key == key))
    db.execute(update(Meeting).where(Meeting.profile == key).values(profile="general"))
    db.commit()


# ------------------------------------------------------------------------------------ documents


class DocumentIn(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    url: str | None = Field(default=None, max_length=1000)
    kind: str = Field(default="doc", pattern="^(doc|runbook)$")
    text: str = Field(default="", max_length=100_000)


class DocumentOut(BaseModel):
    id: int
    title: str
    url: str | None
    kind: str
    excerpt: str
    indexed: bool
    created_at: datetime


def _doc_out(d: Document) -> DocumentOut:
    return DocumentOut(
        id=d.id, title=d.title, url=d.url, kind=d.kind, excerpt=re.sub(r"\s+", " ", d.text)[:240],
        indexed=d.embedding is not None, created_at=d.created_at,
    )  # fmt: skip


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(kind: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Document).order_by(Document.created_at.desc())
    if kind:
        stmt = stmt.where(Document.kind == kind)
    return [_doc_out(d) for d in db.scalars(stmt)]


@router.post("/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def add_document(body: DocumentIn, db: Session = Depends(get_db)):
    """Runbooks and reference docs: found by briefs, incident mode and explain-a-term cards."""
    d = Document(**body.model_dump())
    text = f"{body.title}\n{body.text}".strip()
    try:
        d.embedding = get_embedder().embed([text[:8000]], kind="document")[0]
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    db.add(d)
    db.commit()
    return _doc_out(d)


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    db.execute(delete(Document).where(Document.id == doc_id))
    db.commit()
