"""Search and grounded Q&A over your meeting history.

Retrieval filters in SQL first (person, entity, date range, meeting type, "the last three calls"),
then runs vector top-k over the transcript chunks of the meetings that survive, reranks, and caps the
context. That lets "what has the vendor promised across the last three calls?" hit the right rows
instead of the nearest-sounding text. Structured memory (commitments, decisions) and the matching
meetings' summaries are added as citable sources too.
"""

import math
import re
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .grounding import ungrounded
from .models import (
    Chunk,
    Commitment,
    CommitmentStatus,
    Decision,
    Document,
    Entity,
    EntityMention,
    Meeting,
    MeetingStatus,
    Person,
    Speaker,
    Summary,
)
from .pipeline.memory import similarity, tokens
from .pipeline.transcript import fmt_ts
from .providers import LLM, Embedder
from .schemas import ChatRequest, ChatResponse, SearchHit, Source

ANSWER_SYSTEM = """TASK: answer-from-history
You answer questions about the user's own past meetings, using only the numbered sources provided.
The user is "{owner}"; transcript lines labelled "{owner}" are things the user said.
Today is {today}.
Rules:
- Cite the sources you used inline, like [S2] or [S1][S4].
- If the sources do not contain the answer, say you couldn't find it in their meetings. Do not guess.
- Never invent names, dates, numbers or commitments.
- Be brief: 1-4 sentences, or a short list when the question asks for several items."""

NOT_FOUND = "I couldn't find anything about that in your meetings yet."

_TYPE_WORDS = [
    (r"\bstand-?ups?\b|\bdaily\b|\bscrum\b", "standup"),
    (r"\b1[:-]1s?\b|\bone[- ]on[- ]ones?\b|\b1on1\b", "one_on_one"),
    (r"\b(client|customer|vendor|supplier|partner)s?\b", "client_call"),
    (r"\bincidents?\b|\boutages?\b|\bsev ?[12]\b|\bbridges?\b", "incident"),
    (r"\bplanning\b|\bdesign reviews?\b|\badrs?\b|\barchitecture\b", "planning"),
    (r"\binterviews?\b|\bcandidates?\b", "interview"),
    (r"\bphone calls?\b", "phone_call"),
]
_NUMBERS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
            "ten": 10}  # fmt: skip


@dataclass
class Filters:
    meeting_id: str | None = None
    since: datetime | None = None
    until: datetime | None = None
    profiles: list[str] = field(default_factory=list)
    person_ids: list[str] = field(default_factory=list)
    person_names: list[str] = field(default_factory=list)
    entity_ids: list[int] = field(default_factory=list)
    last_n: int | None = None

    @property
    def narrowing(self) -> bool:
        return bool(self.profiles or self.person_ids or self.entity_ids or self.last_n)


def _date_bounds(since: date | None, until: date | None):
    lo = datetime.combine(since, time.min, tzinfo=UTC) if since else None
    hi = datetime.combine(until + timedelta(days=1), time.min, tzinfo=UTC) if until else None
    return lo, hi


def _contains(text: str, name: str) -> bool:
    return bool(name) and re.search(rf"(?<![\w]){re.escape(name.lower())}(?![\w])", text.lower()) is not None


def parse_filters(
    session: Session,
    question: str,
    *,
    owner_name: str = "",
    meeting_id: str | None = None,
    since: date | None = None,
    until: date | None = None,
    now: datetime | None = None,
) -> Filters:
    now = now or datetime.now(UTC)
    f = Filters(meeting_id=meeting_id)
    f.since, f.until = _date_bounds(since, until)
    q = question.lower()

    for pattern, key in _TYPE_WORDS:
        if re.search(pattern, q):
            f.profiles.append(key)
    if "client_call" in f.profiles and "phone_call" not in f.profiles and re.search(r"\bcalls?\b", q):
        f.profiles.append("phone_call")

    m = re.search(r"\blast (\d+|" + "|".join(_NUMBERS) + r") (?:\w+ )?(calls?|meetings?|standups?|1:1s|syncs?)\b", q)
    if m:
        f.last_n = int(m.group(1)) if m.group(1).isdigit() else _NUMBERS[m.group(1)]
    today = datetime.combine(now.date(), time.min, tzinfo=UTC)
    if not f.since and not f.until:
        if re.search(r"\btoday\b", q):
            f.since = today
        elif re.search(r"\byesterday\b", q):
            f.since, f.until = today - timedelta(days=1), today
        elif "this week" in q:
            f.since = today - timedelta(days=now.weekday())
        elif "last week" in q:
            f.since, f.until = today - timedelta(days=now.weekday() + 7), today - timedelta(days=now.weekday())
        elif "this month" in q:
            f.since = today.replace(day=1)
        elif "last month" in q:
            first = today.replace(day=1)
            f.since, f.until = (first - timedelta(days=1)).replace(day=1), first
        elif m2 := re.search(r"\b(?:last|past) (\d+) days\b", q):
            f.since = today - timedelta(days=int(m2.group(1)))

    for p in session.scalars(select(Person)).all():
        names = [p.display_name, *(p.aliases or [])]
        if p.display_name.lower() == owner_name.lower():
            continue  # "I"/"me" questions are about the user anyway; don't narrow to their own lines
        if any(_contains(q, n) for n in names if len(n) > 1):
            f.person_ids.append(p.id)
            f.person_names.extend(names)
    for e in session.scalars(select(Entity)).all():
        if any(_contains(q, n) for n in [e.name, *(e.aliases or [])] if len(n) > 2):
            f.entity_ids.append(e.id)
    return f


def candidate_meetings(session: Session, f: Filters, *, drop: tuple[str, ...] = ()) -> list[str] | None:
    """Meeting ids that pass the SQL filters, newest first. None means "no filter: search everything"."""
    if f.meeting_id:
        return [f.meeting_id]
    stmt = select(Meeting.id).where(Meeting.status == MeetingStatus.DONE)
    narrowed = False
    if f.since:
        stmt, narrowed = stmt.where(Meeting.started_at >= f.since), True
    if f.until:
        stmt, narrowed = stmt.where(Meeting.started_at < f.until), True
    if f.profiles and "profiles" not in drop:
        stmt, narrowed = stmt.where(Meeting.profile.in_(f.profiles)), True
    if f.entity_ids and "entities" not in drop:
        sub = select(EntityMention.meeting_id).where(EntityMention.entity_id.in_(f.entity_ids))
        stmt, narrowed = stmt.where(Meeting.id.in_(sub)), True
    if f.person_ids and "people" not in drop:
        sub = select(Speaker.meeting_id).where(Speaker.person_id.in_(f.person_ids))
        stmt, narrowed = stmt.where(Meeting.id.in_(sub)), True
    stmt = stmt.order_by(Meeting.started_at.desc())
    if f.last_n:
        stmt, narrowed = stmt.limit(f.last_n), True
    return list(session.scalars(stmt)) if narrowed else None


def _vector_hits(
    session: Session, qvec: list[float], ids: list[str] | None, limit: int
) -> list[tuple[Chunk, Meeting, float]]:
    distance = Chunk.embedding.cosine_distance(qvec)
    stmt = select(Chunk, Meeting, distance.label("distance")).join(Meeting, Meeting.id == Chunk.meeting_id)
    if ids is not None:
        if not ids:
            return []
        stmt = stmt.where(Chunk.meeting_id.in_(ids))
    return [(c, m, float(d)) for c, m, d in session.execute(stmt.order_by(distance).limit(limit)).all()]


def rerank(
    question: str, hits: list[tuple[Chunk, Meeting, float]], f: Filters, now: datetime
) -> list[tuple[Chunk, Meeting, float]]:
    """Blend vector similarity with word overlap, the people asked about, and recency."""
    qt = tokens(question)
    scored = []
    for c, m, d in hits:
        score = 1 - d
        if qt:
            score += 0.15 * len(qt & tokens(c.text)) / len(qt)
        if f.person_names and any(_contains(c.speakers, n) or _contains(c.text, n) for n in f.person_names):
            score += 0.1
        age_days = max(0.0, (now - m.started_at).total_seconds() / 86400)
        score += 0.05 * math.exp(-age_days / 30)
        scored.append((c, m, score))
    return sorted(scored, key=lambda x: x[2], reverse=True)


def retrieve(
    session: Session, embedder: Embedder, question: str, f: Filters, k: int, now: datetime | None = None
) -> list[tuple[Chunk, Meeting, float]]:
    """SQL filters, then vector top-k, then rerank. Filters relax step by step if they find nothing."""
    now = now or datetime.now(UTC)
    qvec = embedder.embed([question], kind="query")[0]
    for drop in ((), ("people",), ("people", "entities"), ("people", "entities", "profiles")):
        ids = candidate_meetings(session, f, drop=drop)
        hits = _vector_hits(session, qvec, ids, k * 4)
        if hits or ids is None:
            break
    return rerank(question, hits, f, now)[:k]


# Phase 1 entry points ---------------------------------------------------------------------------


def search_chunks(
    session: Session,
    embedder: Embedder,
    query: str,
    k: int,
    meeting_id: str | None = None,
    since: date | None = None,
    until: date | None = None,
) -> list[tuple[Chunk, Meeting, float]]:
    """Plain vector search (the Search box); returns (chunk, meeting, cosine distance)."""
    lo, hi = _date_bounds(since, until)
    f = Filters(meeting_id=meeting_id, since=lo, until=hi)
    ids = candidate_meetings(session, f)
    return _vector_hits(session, embedder.embed([query], kind="query")[0], ids, k)


def search(session: Session, embedder: Embedder, query: str, limit: int) -> list[SearchHit]:
    return [
        SearchHit(
            meeting_id=m.id,
            meeting_title=m.title,
            started_at=m.started_at,
            start=c.start,
            end=c.end,
            speakers=c.speakers,
            text=c.text,
            score=round(1 - d, 4),
        )
        for c, m, d in search_chunks(session, embedder, query, limit)
    ]


# ---------------------------------------------------------------------------------- sources


def summary_text(data: dict) -> str:
    parts = [data.get("overview") or ""]
    for p in data.get("people") or []:
        bits = []
        for key in ("yesterday", "today", "blockers"):
            if p.get(key):
                bits.append(f"{key}: " + "; ".join(p[key]))
        if bits:
            parts.append(f"{p.get('name')}: " + " | ".join(bits))
    decisions = [d if isinstance(d, str) else d.get("text", "") for d in data.get("decisions") or []]
    if decisions:
        parts.append("Decisions: " + "; ".join(decisions))
    for a in data.get("action_items") or []:
        parts.append(
            f"Action: {a.get('owner') or 'unassigned'} - {a.get('text')}"
            + (f" (due {a['due']})" if a.get("due") else "")
        )
    for key, value in (data.get("fields") or {}).items():
        if value:
            label = key.replace("_", " ").capitalize()
            parts.append(f"{label}: " + ("; ".join(value) if isinstance(value, list) else str(value)[:1500]))
    return "\n".join(p for p in parts if p)


def memory_sources(session: Session, question: str, f: Filters, limit: int = 4) -> list[Source]:
    """Commitments and decisions about the people/entities asked about, or that match the question."""
    out: list[Source] = []
    ids = candidate_meetings(session, f)
    asks_promises = re.search(r"\b(promis|commit|owe|said .* would|deliver|due|done by)", question.lower())

    stmt = select(Commitment).order_by(Commitment.last_mentioned_at.desc()).limit(200)
    commitments = session.scalars(stmt).all()
    scored = []
    for c in commitments:
        s = similarity(c.text, question)
        if f.person_ids and c.owner_person_id in f.person_ids:
            s += 0.5
        if ids is not None and c.last_meeting_id in ids:
            s += 0.4 if asks_promises else 0.15
        if s >= 0.35:
            scored.append((s, c))
    meetings = {}
    for _s, c in sorted(scored, key=lambda x: x[0], reverse=True)[:limit]:
        mid = c.last_meeting_id or c.first_meeting_id
        m = meetings.get(mid) or (session.get(Meeting, mid) if mid else None)
        meetings[mid] = m
        status = "done" if c.status == CommitmentStatus.DONE else "open"
        due = f", due {c.due}" if c.due else ""
        out.append(
            Source(
                n=0,
                kind="commitment",
                meeting_id=mid,
                meeting_title=m.title if m else "",
                started_at=c.last_mentioned_at,
                start=None,
                end=None,
                speakers=c.owner or "",
                text=f"{c.owner or 'Someone'} committed to: {c.text}{due} ({status}; mentioned in {c.mention_count} "
                f"meeting(s), first {c.first_mentioned_at:%Y-%m-%d})",
            )  # fmt: skip
        )

    dstmt = select(Decision, Meeting).join(Meeting, Meeting.id == Decision.meeting_id)
    if ids is not None:
        dstmt = dstmt.where(Decision.meeting_id.in_(ids)) if ids else dstmt.where(False)
    drows = session.execute(dstmt.order_by(Decision.decided_at.desc()).limit(200)).all()
    ranked = sorted(
        ((similarity(d.text, question) + (0.2 if ids is not None else 0), d, m) for d, m in drows),
        key=lambda x: x[0],
        reverse=True,
    )
    for s, d, m in ranked[:limit]:
        if s < 0.3:
            break
        out.append(
            Source(
                n=0,
                kind="decision",
                meeting_id=m.id,
                meeting_title=m.title,
                started_at=m.started_at,
                start=d.at,
                end=None,
                speakers=d.owner or "",
                text=f"Decided: {d.text}",
            )  # fmt: skip
        )
    return out


def document_sources(session: Session, embedder: Embedder, question: str, kind: str | None, limit: int = 2):
    """Runbooks and linked docs (incident mode, briefs). kind=None searches every document."""
    qvec = embedder.embed([question], kind="query")[0]
    dist = Document.embedding.cosine_distance(qvec)
    stmt = select(Document, dist).where(Document.embedding.is_not(None))
    if kind:
        stmt = stmt.where(Document.kind == kind)
    rows = session.execute(stmt.order_by(dist).limit(limit)).all()
    return [
        Source(
            n=0,
            kind="document",
            meeting_id=None,
            meeting_title=doc.title,
            started_at=doc.created_at,
            start=None,
            end=None,
            speakers="",
            text=doc.text[:1500],
            url=doc.url,
            score=round(1 - float(d), 4),
        )  # fmt: skip
        for doc, d in rows
        if 1 - float(d) > 0.2
    ]


def build_sources(
    session: Session,
    embedder: Embedder,
    question: str,
    f: Filters,
    settings: Settings,
    k: int | None = None,
    include_documents: str | None = None,
) -> tuple[list[Source], float]:
    """Numbered, context-capped sources for a question, and the best retrieval score (confidence)."""
    k = k or settings.chat_top_k
    hits = retrieve(session, embedder, question, f, k)
    sources: list[Source] = []
    best = 0.0
    for c, m, score in hits:
        best = max(best, score)
        sources.append(
            Source(
                n=0,
                kind="transcript",
                meeting_id=m.id,
                meeting_title=m.title,
                started_at=m.started_at,
                start=c.start,
                end=c.end,
                speakers=c.speakers,
                text=c.text,
                score=round(score, 4),
            )  # fmt: skip
        )
    mem = memory_sources(session, question, f)
    if mem:
        best = max(best, 0.5)
    sources += mem
    # Summaries of the (up to 3) meetings the best chunks came from hold the distilled updates.
    meeting_ids = list(dict.fromkeys(m.id for _c, m, _s in hits))[:3]
    if meeting_ids:
        rows = session.execute(
            select(Summary, Meeting)
            .join(Meeting, Meeting.id == Summary.meeting_id)
            .where(Summary.meeting_id.in_(meeting_ids))
        ).all()
        for s, m in sorted(rows, key=lambda r: meeting_ids.index(r[1].id)):
            text = summary_text(s.data)
            if text:
                sources.append(
                    Source(
                        n=0,
                        kind="summary",
                        meeting_id=m.id,
                        meeting_title=m.title,
                        started_at=m.started_at,
                        start=None,
                        end=None,
                        speakers="",
                        text=text,
                    )  # fmt: skip
                )
    if include_documents is not None:
        sources += document_sources(session, embedder, question, include_documents or None)

    capped, used = [], 0
    for s in sources:  # cap the context: transcript first, then memory, summaries, documents
        if used + len(s.text) > settings.retrieval_max_context_chars and capped:
            continue
        used += len(s.text)
        capped.append(s)
    for i, s in enumerate(capped, 1):
        s.n = i
    return capped, best


def format_sources(sources: list[Source]) -> str:
    blocks = []
    for s in sources:
        when = f"{s.started_at:%a %Y-%m-%d}" if s.started_at else ""
        where = f" at {fmt_ts(s.start)}" if s.start is not None else f" ({s.kind})"
        blocks.append(f"[S{s.n}] {s.meeting_title} - {when}{where}\n{s.text}")
    return "\n\n".join(blocks)


def answer(
    session: Session, llm: LLM, embedder: Embedder, req: ChatRequest, settings: Settings, owner_name: str | None = None
) -> ChatResponse:
    owner = owner_name or settings.owner_name
    f = parse_filters(
        session, req.question, owner_name=owner, meeting_id=req.meeting_id, since=req.since, until=req.until
    )
    sources, best = build_sources(session, embedder, req.question, f, settings)
    if not sources:
        return ChatResponse(answer=NOT_FOUND, sources=[], grounded=True, confidence=0.0)
    user_msg = "Sources:\n\n" + format_sources(sources) + f"\n\nQuestion: {req.question}"
    history = [{"role": t.role, "content": t.content} for t in req.history[-6:]]
    system = ANSWER_SYSTEM.format(owner=owner, today=datetime.now(UTC).strftime("%A %Y-%m-%d"))
    reply = llm.complete(system, [*history, {"role": "user", "content": user_msg}], max_tokens=1500).strip()
    missing = ungrounded(reply, [s.text + " " + s.meeting_title + " " + s.speakers for s in sources],
                         req.question + " " + owner)  # fmt: skip
    return ChatResponse(
        answer=reply, sources=sources, grounded=not missing, unsupported=missing, confidence=round(best, 3)
    )
