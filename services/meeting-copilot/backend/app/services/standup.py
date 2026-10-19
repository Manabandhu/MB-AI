"""Your standup update, pre-drafted; and rehearse mode, which tightens it to under a minute.

Yesterday: Jira, GitHub and CI activity since your last standup, plus commitments you closed.
Today: what you committed to and haven't finished.
Blockers: your blockers from last time, for you to confirm or drop.
"""

import json
import re
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import Principal
from ..config import Settings
from ..integrations.activity import collect_activity
from ..integrations.config import integration_config
from ..models import Commitment, CommitmentStatus, Meeting, MeetingStatus, Person, Summary
from ..pipeline.summarize import parse_json_object
from ..providers import LLM, ProviderError

DRAFT_SYSTEM = """TASK: standup-draft
Draft {owner}'s standup update from the JSON that follows. Use only that data.
Return JSON: {{"yesterday": ["..."], "today": ["..."], "blockers": ["..."]}}. Short phrases in first person,
keep ticket keys, PR numbers and system names exactly. Merge duplicates. No more than 4 items per list."""

REHEARSE_SYSTEM = """TASK: rehearse
Tighten this spoken standup update so it takes under 60 seconds to say (about 130 words at most).
Keep every ticket, system and name; drop filler and repetition. Return only the tightened update."""

WORDS_PER_SECOND = 2.5


def _mine(db: Session, principal: Principal) -> tuple[set[str], set[str]]:
    people = db.scalars(select(Person).where(Person.account_user_id == principal.user_id)).all()
    names = {principal.display_name.lower()} | {n.lower() for p in people for n in [p.display_name, *(p.aliases or [])]}
    return {p.id for p in people}, names


def last_standup(db: Session, before: datetime) -> Meeting | None:
    return db.scalars(
        select(Meeting)
        .where(Meeting.profile == "standup", Meeting.status == MeetingStatus.DONE, Meeting.started_at < before)
        .order_by(Meeting.started_at.desc())
    ).first()


def standup_inputs(db: Session, principal: Principal, settings: Settings, now: datetime | None = None) -> dict:
    now = now or datetime.now(UTC)
    prev = last_standup(db, now - timedelta(minutes=30))
    since = prev.started_at if prev else now - timedelta(days=3 if now.weekday() == 0 else 1)
    ids, names = _mine(db, principal)

    def is_mine(c: Commitment) -> bool:
        return c.owner_person_id in ids or (c.owner or "").lower() in names

    commitments = [c for c in db.scalars(select(Commitment)).all() if is_mine(c)]
    open_ = [c.text for c in commitments if c.status == CommitmentStatus.OPEN]
    done = [c.text for c in commitments if c.status == CommitmentStatus.DONE and c.done_at and c.done_at >= since]
    blockers: list[str] = []
    if prev is not None:
        s = db.get(Summary, prev.id)
        for p in (s.data.get("people") or []) if s else []:
            if (p.get("name") or "").lower() in names:
                blockers = list(p.get("blockers") or [])
    activity = collect_activity(integration_config(principal.workspace_id, settings), since)
    return {
        "since": since.isoformat(),
        "last_standup": {"id": prev.id, "title": prev.title, "started_at": prev.started_at.isoformat()}
        if prev
        else None,
        "activity": [a.as_dict() for a in activity[:15]],
        "done": done,
        "open_commitments": open_,
        "blockers": blockers,
    }


def _lists(data: dict) -> dict[str, list[str]]:
    return {
        k: [str(x).strip() for x in (data.get(k) or []) if str(x).strip()][:4]
        for k in ("yesterday", "today", "blockers")
    }


def draft_standup(db: Session, principal: Principal, llm: LLM, settings: Settings, now: datetime | None = None) -> dict:
    inputs = standup_inputs(db, principal, settings, now)
    fallback = {
        "yesterday": [a["text"] for a in inputs["activity"]][:3] + inputs["done"][:2],
        "today": inputs["open_commitments"][:4],
        "blockers": inputs["blockers"][:2],
    }
    try:
        reply = llm.complete(
            DRAFT_SYSTEM.format(owner=principal.display_name),
            [{"role": "user", "content": "Data:\n" + json.dumps(inputs)}],
            max_tokens=800,
            json_mode=True,
        )
        draft = _lists(parse_json_object(reply))
    except (ProviderError, ValueError):
        draft = _lists(fallback)
    text = (
        " ".join(
            f"{label}: {'; '.join(draft[key])}."
            for key, label in (("yesterday", "Yesterday"), ("today", "Today"), ("blockers", "Blockers"))
            if draft[key]
        )
        or "Nothing to report from your history or activity yet."
    )
    return {**draft, "text": text, "inputs": inputs}


def rehearse(llm: LLM, text: str) -> dict:
    before = len(text.split())
    tightened = llm.complete(REHEARSE_SYSTEM, [{"role": "user", "content": text}], max_tokens=600).strip()
    tightened = re.sub(r"^\s*(here'?s|tightened)[^:\n]*:\s*", "", tightened, flags=re.I)
    after = len(tightened.split())
    return {
        "text": tightened,
        "words_before": before,
        "words_after": after,
        "seconds_before": round(before / WORDS_PER_SECOND),
        "seconds_after": round(after / WORDS_PER_SECOND),
        "under_a_minute": after / WORDS_PER_SECOND <= 60,
    }
