"""Answer cards: 1-2 sentences you can say, up to three supporting facts, and source chips.

Grounding rules:
  - answer only from retrieved sources; every card shows where it came from (meeting + timestamp)
  - below the confidence threshold the card says "Not in your history — say you'll follow up"
  - never invent numbers, dates or names: an answer whose specifics aren't in its sources is
    replaced by the fallback

Latency budget (targets): retrieval ≤ 300 ms, first LLM token ≤ 1 s, card complete ≤ 3 s from the
trigger. Every card records its timings so the Phase 3 gate can be measured.
"""

import logging
import re
import time
from collections.abc import Callable
from dataclasses import dataclass

from ..config import Settings
from ..db import Scope, new_session
from ..grounding import ungrounded
from ..models import LiveCard
from ..pipeline.profiles import Profile
from ..providers import LLM, Embedder, ProviderError
from ..providers.llm import stream_text
from ..retrieval import Filters, build_sources, format_sources, parse_filters
from ..schemas import Source
from .detector import Trigger

log = logging.getLogger(__name__)

FALLBACK = "Not in your history — say you'll follow up."

LIVE_SYSTEM = """TASK: live-answer
You help {owner} answer a question during a live {profile} meeting, using only the numbered sources.
{focus}
Write one or two short sentences {owner} can say out loud, citing sources like [S1].
Then up to three supporting facts, each on its own line starting with "- " and ending with its citation.
If the sources don't answer it, reply exactly: NOT_IN_HISTORY
Never invent numbers, dates or names. No preamble."""

EXPLAIN_SYSTEM = """TASK: explain-term
Explain "{term}" in one or two plain sentences for someone in a meeting, using only the numbered sources,
citing them like [S1]. If the sources don't explain it, reply exactly: NOT_IN_HISTORY"""

_CITE = re.compile(r"\[S(\d+)\]")


@dataclass
class CardContext:
    scope: Scope
    meeting_id: str
    owner: str
    profile: Profile
    attendee_ids: list[str]


def _source_chip(s: Source) -> dict:
    return {
        "n": s.n,
        "kind": s.kind,
        "meeting_id": s.meeting_id,
        "meeting_title": s.meeting_title,
        "started_at": s.started_at.isoformat() if s.started_at else None,
        "start": s.start,
        "url": s.url,
        "text": s.text[:400],
    }


def parse_card(reply: str) -> tuple[str, list[str]]:
    lines = [ln.strip() for ln in reply.strip().splitlines() if ln.strip()]
    answer = " ".join(ln for ln in lines if not ln.startswith(("- ", "• ", "* ")))
    facts = [ln[2:].strip() for ln in lines if ln.startswith(("- ", "• ", "* "))][:3]
    return answer.strip(), facts


def _save(ctx: CardContext, card: dict) -> dict:
    with new_session(ctx.scope) as db:
        row = LiveCard(
            meeting_id=ctx.meeting_id,
            kind=card["kind"],
            trigger=card["trigger"],
            trigger_text=card["trigger_text"],
            at=card["at"],
            answer=card["answer"],
            facts=card["facts"],
            sources=card["sources"],
            grounded=card["grounded"],
            confidence=card["confidence"],
            timings_ms=card["timings_ms"],
        )
        db.add(row)
        db.commit()
        card["id"] = row.id
    return card


def _base(trig: Trigger, kind: str) -> dict:
    return {
        "id": None,
        "kind": kind,
        "trigger": trig.kind,
        "trigger_text": trig.text,
        "question": trig.question,
        "speaker": trig.speaker,
        "at": round(trig.at, 2),
        "answer": "",
        "facts": [],
        "sources": [],
        "grounded": True,
        "confidence": 0.0,
        "timings_ms": {},
    }


def _filters(db, ctx: CardContext, question: str) -> Filters:
    f = parse_filters(db, question, owner_name=ctx.owner)
    if not f.profiles and ctx.profile.retrieve_profiles and ctx.profile.retrieve_profiles != ("",):
        f.profiles = list(ctx.profile.retrieve_profiles)  # relaxed automatically if it finds nothing
    if not f.person_ids and ctx.profile.key in ("client_call", "phone_call", "one_on_one") and ctx.attendee_ids:
        f.person_ids = list(ctx.attendee_ids)
    return f


def draft_card(
    ctx: CardContext,
    trig: Trigger,
    *,
    llm: LLM,
    embedder: Embedder,
    settings: Settings,
    context: list[str],
    prefetched: list[Source] | None = None,
    on_delta: Callable[[str], None] | None = None,
    t0: float | None = None,
) -> dict:
    """Retrieve, draft (streaming), ground-check and save one answer card."""
    t0 = t0 or time.monotonic()
    kind = {"keyword": "keyword", "explain": "explain"}.get(trig.kind, "answer")
    card = _base(trig, kind)
    query = trig.question if len(trig.question) > 25 or not context else " ".join([*context[-2:], trig.question])
    try:
        with new_session(ctx.scope) as db:
            f = _filters(db, ctx, trig.question)
            docs = "runbook" if ctx.profile.key == "incident" else ("" if kind == "explain" else None)
            sources, best = build_sources(db, embedder, query, f, settings, k=5, include_documents=docs)
    except ProviderError as e:
        log.warning("live retrieval failed: %s", e)
        sources, best = [], 0.0
    if prefetched:  # context fetched when the meeting started or the name was first heard
        seen = {(s.meeting_id, s.start, s.kind) for s in sources}
        for s in prefetched:
            if (s.meeting_id, s.start, s.kind) not in seen and len(sources) < 8:
                sources.append(s.model_copy(update={"n": len(sources) + 1}))
    t_retrieval = time.monotonic()
    card["confidence"] = round(best, 3)
    card["timings_ms"]["retrieval"] = round((t_retrieval - t0) * 1000)

    if not sources or best < settings.live_answer_min_score:
        return _finish(ctx, card, t0, grounded=False)

    if kind == "explain":
        system = EXPLAIN_SYSTEM.format(term=trig.term or trig.question)
    else:
        system = LIVE_SYSTEM.format(
            owner=ctx.owner,
            profile=ctx.profile.label,
            focus=f"Focus: {ctx.profile.live_assist}" if ctx.profile.live_assist else "",
        )
    said = "\n".join(context[-6:])
    user = f"Sources:\n\n{format_sources(sources)}\n\nRecent conversation:\n{said}\n\nQuestion: {trig.question}"
    reply, first = "", None
    try:
        for delta in stream_text(llm, system, [{"role": "user", "content": user}], max_tokens=350):
            if first is None:
                first = time.monotonic()
                card["timings_ms"]["first_token"] = round((first - t0) * 1000)
            reply += delta
            if on_delta and "NOT_IN_HISTORY" not in reply:
                on_delta(delta)
    except ProviderError as e:
        log.warning("live answer failed: %s", e)
        return _finish(ctx, card, t0, grounded=False)

    if "NOT_IN_HISTORY" in reply:
        return _finish(ctx, card, t0, grounded=False)
    answer, facts = parse_card(reply)
    texts = [s.text + " " + s.meeting_title + " " + s.speakers for s in sources]
    if ungrounded(reply, texts, trig.question + " " + said + " " + ctx.owner):
        return _finish(ctx, card, t0, grounded=False)
    cited = [int(n) for n in _CITE.findall(reply)]
    chips = [s for s in sources if s.n in cited] or sources[:3]
    card["answer"], card["facts"] = answer, facts
    card["sources"] = [_source_chip(s) for s in chips[:3]]
    return _finish(ctx, card, t0, grounded=True)


def _finish(ctx: CardContext, card: dict, t0: float, *, grounded: bool) -> dict:
    if not grounded:
        card["answer"], card["facts"], card["sources"] = FALLBACK, [], []
    card["grounded"] = grounded
    card["timings_ms"]["total"] = round((time.monotonic() - t0) * 1000)
    return _save(ctx, card)


def commitment_card(ctx: CardContext, trig: Trigger) -> dict:
    """No model needed: the commitment and where it was made."""
    c = trig.commitment or {}
    card = _base(trig, "nudge")
    due = f" by {c['due']}" if c.get("due") else ""
    who = "You" if c.get("mine") else (c.get("owner") or "Someone")
    card["answer"] = f"{who} said this would be done{due}: {c.get('text', '')}"
    if c.get("meeting_id"):
        card["sources"] = [
            {
                "n": 1,
                "kind": "commitment",
                "meeting_id": c["meeting_id"],
                "meeting_title": c.get("meeting_title", ""),
                "started_at": c.get("said_at"),
                "start": c.get("at"),
                "url": None,
                "text": c.get("text", ""),
            }
        ]
    card["confidence"] = 1.0
    card["timings_ms"] = {"total": 0}
    return _save(ctx, card)


def glossary_card(ctx: CardContext, trig: Trigger, definition: str) -> dict:
    card = _base(trig, "explain")
    card["answer"] = definition
    card["sources"] = [
        {
            "n": 1,
            "kind": "glossary",
            "meeting_id": None,
            "meeting_title": f"Glossary: {trig.term}",
            "started_at": None,
            "start": None,
            "url": None,
            "text": definition,
        }
    ]
    card["confidence"] = 1.0
    card["timings_ms"] = {"total": 0}
    return _save(ctx, card)


def update_card(ctx: CardContext, draft: dict) -> dict:
    """The pre-filled standup update, shown when a standup starts."""
    trig = Trigger("update", "", "Your update", ctx.owner, 0.0)
    card = _base(trig, "update")
    card["answer"] = draft["text"]
    card["facts"] = [f"{k.title()}: {'; '.join(draft[k])}" for k in ("yesterday", "today", "blockers") if draft.get(k)]
    card["confidence"] = 1.0
    card["timings_ms"] = {"total": 0}
    return _save(ctx, card)
