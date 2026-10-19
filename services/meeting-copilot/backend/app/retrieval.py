"""Search and grounded Q&A over your meeting history."""

from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .models import Chunk, Meeting, Summary
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


def _date_bounds(since: date | None, until: date | None):
    lo = datetime.combine(since, time.min, tzinfo=UTC) if since else None
    hi = datetime.combine(until + timedelta(days=1), time.min, tzinfo=UTC) if until else None
    return lo, hi


def search_chunks(
    session: Session,
    embedder: Embedder,
    query: str,
    k: int,
    meeting_id: str | None = None,
    since: date | None = None,
    until: date | None = None,
) -> list[tuple[Chunk, Meeting, float]]:
    qvec = embedder.embed([query], kind="query")[0]
    distance = Chunk.embedding.cosine_distance(qvec)
    stmt = select(Chunk, Meeting, distance.label("distance")).join(Meeting, Meeting.id == Chunk.meeting_id)
    if meeting_id:
        stmt = stmt.where(Chunk.meeting_id == meeting_id)
    lo, hi = _date_bounds(since, until)
    if lo:
        stmt = stmt.where(Meeting.started_at >= lo)
    if hi:
        stmt = stmt.where(Meeting.started_at < hi)
    rows = session.execute(stmt.order_by(distance).limit(k)).all()
    return [(c, m, float(d)) for c, m, d in rows]


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


def _summary_text(data: dict) -> str:
    parts = [data.get("overview") or ""]
    for p in data.get("people") or []:
        bits = []
        for key in ("yesterday", "today", "blockers"):
            if p.get(key):
                bits.append(f"{key}: " + "; ".join(p[key]))
        if bits:
            parts.append(f"{p.get('name')}: " + " | ".join(bits))
    if data.get("decisions"):
        parts.append("Decisions: " + "; ".join(data["decisions"]))
    for a in data.get("action_items") or []:
        parts.append(
            f"Action: {a.get('owner') or 'unassigned'} - {a.get('text')}"
            + (f" (due {a['due']})" if a.get("due") else "")
        )
    return "\n".join(p for p in parts if p)


def answer(session: Session, llm: LLM, embedder: Embedder, req: ChatRequest, settings: Settings) -> ChatResponse:
    hits = search_chunks(session, embedder, req.question, settings.chat_top_k, req.meeting_id, req.since, req.until)
    sources: list[Source] = []
    for c, m, _d in hits:
        sources.append(
            Source(
                n=len(sources) + 1,
                kind="transcript",
                meeting_id=m.id,
                meeting_title=m.title,
                started_at=m.started_at,
                start=c.start,
                end=c.end,
                speakers=c.speakers,
                text=c.text,
            )  # fmt: skip
        )
    # Add the summaries of the (up to 3) meetings the best chunks came from: they hold the
    # distilled updates, decisions and action items that single chunks often miss.
    meeting_ids = list(dict.fromkeys(m.id for _c, m, _d in hits))[:3]
    if meeting_ids:
        rows = session.execute(
            select(Summary, Meeting)
            .join(Meeting, Meeting.id == Summary.meeting_id)
            .where(Summary.meeting_id.in_(meeting_ids))
        ).all()
        for s, m in sorted(rows, key=lambda r: meeting_ids.index(r[1].id)):
            text = _summary_text(s.data)
            if text:
                sources.append(
                    Source(
                        n=len(sources) + 1,
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

    if not sources:
        return ChatResponse(answer="I couldn't find anything about that in your meetings yet.", sources=[])

    blocks = []
    for s in sources:
        where = f" at {fmt_ts(s.start)}" if s.start is not None else " (summary)"
        blocks.append(f"[S{s.n}] {s.meeting_title} - {s.started_at:%a %Y-%m-%d}{where}\n{s.text}")
    user_msg = "Sources:\n\n" + "\n\n".join(blocks) + f"\n\nQuestion: {req.question}"
    history = [{"role": t.role, "content": t.content} for t in req.history[-6:]]
    system = ANSWER_SYSTEM.format(owner=settings.owner_name, today=datetime.now(UTC).strftime("%A %Y-%m-%d"))
    reply = llm.complete(system, [*history, {"role": "user", "content": user_msg}], max_tokens=1500)
    return ChatResponse(answer=reply.strip(), sources=sources)
