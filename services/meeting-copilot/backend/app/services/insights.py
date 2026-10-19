"""Rollups, missed-meeting digests and the blocker radar.

rollup          per person over a week or sprint: commitments made, done, open and stuck; blockers raised;
                decisions; meetings and talk time. Also a timesheet (time in meetings by day and type).
digest          a meeting you missed, cut down to the parts that mention you or your work.
blocker radar   blockers that keep coming back across standups (same words or same system/team),
                turned into nudges.
"""

from collections import defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import Principal
from ..models import (
    ActionItem,
    Commitment,
    CommitmentMention,
    CommitmentStatus,
    Decision,
    Entity,
    EntityMention,
    Meeting,
    MeetingStatus,
    Person,
    Segment,
    Speaker,
    Summary,
    User,
)
from ..pipeline.memory import is_stuck, similarity, tokens
from ..pipeline.people import is_generic_name
from ..retrieval import _contains


def _meetings(db: Session, since: datetime, until: datetime) -> list[Meeting]:
    return list(
        db.scalars(
            select(Meeting)
            .where(Meeting.status == MeetingStatus.DONE, Meeting.started_at >= since, Meeting.started_at < until)
            .order_by(Meeting.started_at)
        )
    )


def rollup(db: Session, since: datetime, until: datetime, now: datetime | None = None) -> dict:
    now = now or datetime.now(UTC)
    meetings = _meetings(db, since, until)
    ids = [m.id for m in meetings]
    people: dict[str, dict] = defaultdict(
        lambda: {"meetings": 0, "talk_s": 0.0, "made": [], "done": [], "open": [], "stuck": [], "blockers": []}
    )

    speakers = db.execute(select(Speaker).where(Speaker.meeting_id.in_(ids))).scalars().all() if ids else []
    names = {(s.meeting_id, s.label): s.display_name for s in speakers}
    for s in speakers:
        if not is_generic_name(s.display_name):
            people[s.display_name]["meetings"] += 1
    for seg in db.scalars(select(Segment).where(Segment.meeting_id.in_(ids))) if ids else []:
        name = names.get((seg.meeting_id, seg.speaker_label))
        if name and not is_generic_name(name):
            people[name]["talk_s"] += seg.end - seg.start

    mentioned = (
        db.execute(
            select(CommitmentMention, Commitment)
            .join(Commitment, Commitment.id == CommitmentMention.commitment_id)
            .where(CommitmentMention.meeting_id.in_(ids))
        ).all()
        if ids
        else []
    )
    seen: set[tuple[int, str]] = set()
    for mention, c in mentioned:
        owner = c.owner or "Unassigned"
        ref = {"id": c.id, "text": c.text, "due": c.due, "status": c.status}
        if mention.kind == "made" and (c.id, "made") not in seen:
            people[owner]["made"].append(ref)
            seen.add((c.id, "made"))
    for c in db.scalars(select(Commitment)):
        owner = c.owner or "Unassigned"
        ref = {"id": c.id, "text": c.text, "due": c.due, "status": c.status}
        if c.status == CommitmentStatus.DONE and c.done_at and since <= c.done_at < until:
            people[owner]["done"].append(ref)
        elif c.status == CommitmentStatus.OPEN and c.first_mentioned_at < until:
            people[owner]["open"].append(ref)
            if is_stuck(c, now):
                people[owner]["stuck"].append(ref)

    for m in meetings:
        if m.profile != "standup":
            continue
        s = db.get(Summary, m.id)
        for p in (s.data.get("people") or []) if s else []:
            for b in p.get("blockers") or []:
                people[p.get("name") or "Unknown"]["blockers"].append({"text": b, "meeting_id": m.id})

    decisions = (
        db.execute(
            select(Decision, Meeting.title)
            .join(Meeting, Meeting.id == Decision.meeting_id)
            .where(Decision.meeting_id.in_(ids))
        ).all()
        if ids
        else []
    )

    by_day: dict[str, float] = defaultdict(float)
    by_profile: dict[str, float] = defaultdict(float)
    for m in meetings:
        minutes = (m.duration_s or 0) / 60
        by_day[m.started_at.date().isoformat()] += minutes
        by_profile[m.profile] += minutes

    rows = [
        {
            "name": n,
            "meetings": v["meetings"],
            "talk_minutes": round(v["talk_s"] / 60, 1),
            "made": v["made"],
            "done": v["done"],
            "open": v["open"],
            "stuck": v["stuck"],
            "blockers": v["blockers"],
        }
        for n, v in people.items()
    ]
    rows.sort(key=lambda r: (-len(r["stuck"]), -len(r["open"]), r["name"]))
    return {
        "since": since.isoformat(),
        "until": until.isoformat(),
        "meetings": [
            {
                "id": m.id,
                "title": m.title,
                "profile": m.profile,
                "started_at": m.started_at.isoformat(),
                "minutes": round((m.duration_s or 0) / 60, 1),
            }
            for m in meetings
        ],
        "people": rows,
        "decisions": [
            {"text": d.text, "owner": d.owner, "meeting_id": d.meeting_id, "meeting_title": t} for d, t in decisions
        ],
        "timesheet": {
            "total_minutes": round(sum(by_day.values()), 1),
            "by_day": {k: round(v, 1) for k, v in sorted(by_day.items())},
            "by_profile": {k: round(v, 1) for k, v in sorted(by_profile.items(), key=lambda kv: -kv[1])},
        },
        "totals": {
            "made": sum(len(r["made"]) for r in rows),
            "done": sum(len(r["done"]) for r in rows),
            "open": sum(len(r["open"]) for r in rows),
            "stuck": sum(len(r["stuck"]) for r in rows),
        },
    }


def rollup_markdown(r: dict) -> str:
    out = [f"# Rollup {r['since'][:10]} to {r['until'][:10]}", ""]
    t = r["totals"]
    out += [
        f"{len(r['meetings'])} meetings, {r['timesheet']['total_minutes']:.0f} minutes. "
        f"Commitments: {t['made']} made, {t['done']} done, {t['open']} open, {t['stuck']} stuck.",
        "",
    ]
    for p in r["people"]:
        if not (p["made"] or p["done"] or p["open"] or p["blockers"]):
            continue
        out.append(f"## {p['name']}")
        for key, label in (("done", "Done"), ("open", "Open"), ("stuck", "Stuck (3+ days)")):
            for c in p[key]:
                out.append(f"- {label}: {c['text']}" + (f" (due {c['due']})" if c.get("due") else ""))
        for b in p["blockers"]:
            out.append(f"- Blocker: {b['text']}")
        out.append("")
    if r["decisions"]:
        out += ["## Decisions", *[f"- {d['text']} ({d['meeting_title']})" for d in r["decisions"]], ""]
    out += ["## Time in meetings", *[f"- {k}: {v:.0f} min" for k, v in r["timesheet"]["by_profile"].items()]]
    return "\n".join(out).rstrip() + "\n"


def _me(db: Session, principal: Principal) -> tuple[list[str], set[str], list[str]]:
    user = db.get(User, principal.user_id)
    people = db.scalars(select(Person).where(Person.account_user_id == principal.user_id)).all()
    names = [
        principal.display_name,
        *(user.aliases or [] if user else []),
        *(a for p in people for a in (p.aliases or [])),
    ]
    return [n for n in names if n], {p.id for p in people}, list(user.watched_keywords or []) if user else []


def missed_meeting_digest(db: Session, meeting: Meeting, principal: Principal) -> dict:
    """Only the parts of a meeting that mention you or your work."""
    names, my_ids, keywords = _me(db, principal)
    mine = [
        c
        for c in db.scalars(select(Commitment).where(Commitment.status == CommitmentStatus.OPEN))
        if c.owner_person_id in my_ids or (c.owner or "").lower() in {n.lower() for n in names}
    ]
    my_entity_ids = (
        {
            em.entity_id
            for em in db.scalars(
                select(EntityMention).where(
                    EntityMention.meeting_id.in_(select(Speaker.meeting_id).where(Speaker.person_id.in_(my_ids)))
                )
            )
        }
        if my_ids
        else set()
    )
    my_entities = (
        [e.name for e in db.scalars(select(Entity).where(Entity.id.in_(my_entity_ids)))] if my_entity_ids else []
    )
    speakers = {s.label: s.display_name for s in db.scalars(select(Speaker).where(Speaker.meeting_id == meeting.id))}

    hits = []
    for seg in db.scalars(select(Segment).where(Segment.meeting_id == meeting.id).order_by(Segment.start)):
        why = []
        if any(_contains(seg.text, n) for n in names):
            why.append("mentions you")
        why += [f"mentions {k}" for k in keywords if _contains(seg.text, k)]
        why += [f"about {e}" for e in my_entities if _contains(seg.text, e)][:2]
        if any(similarity(c.text, seg.text) >= 0.5 for c in mine):
            why.append("about something you committed to")
        if why:
            hits.append(
                {
                    "segment_id": seg.id,
                    "start": seg.start,
                    "speaker": speakers.get(seg.speaker_label, seg.speaker_label),
                    "text": seg.text,
                    "why": why,
                }
            )
    s = db.get(Summary, meeting.id)
    data = s.data if s else {}
    lower = {n.lower() for n in names}
    your_items = [
        {"id": a.id, "text": a.text, "due": a.due, "at": a.at}
        for a in db.scalars(select(ActionItem).where(ActionItem.meeting_id == meeting.id))
        if (a.owner or "").lower() in lower
    ]
    your_update = next((p for p in data.get("people") or [] if (p.get("name") or "").lower() in lower), None)
    decisions = [d if isinstance(d, str) else d.get("text", "") for d in data.get("decisions") or []]
    relevant_decisions = [d for d in decisions if any(_contains(d, n) for n in [*names, *keywords, *my_entities])]
    return {
        "meeting": {"id": meeting.id, "title": meeting.title, "started_at": meeting.started_at.isoformat()},
        "overview": data.get("overview"),
        "mentions": hits,
        "your_action_items": your_items,
        "your_update": your_update,
        "decisions_about_your_work": relevant_decisions,
        "nothing_for_you": not (hits or your_items or relevant_decisions),
    }


def blocker_radar(db: Session, days: int = 14, now: datetime | None = None, min_standups: int = 2) -> list[dict]:
    """Blockers that recur across standups: same words, or the same system/team named."""
    now = now or datetime.now(UTC)
    meetings = [
        m for m in _meetings(db, now - timedelta(days=days), now + timedelta(minutes=1)) if m.profile == "standup"
    ]
    entities = db.scalars(select(Entity)).all()
    items = []
    for m in meetings:
        s = db.get(Summary, m.id)
        for p in (s.data.get("people") or []) if s else []:
            for b in p.get("blockers") or []:
                ents = sorted({e.name for e in entities if any(_contains(b, n) for n in [e.name, *(e.aliases or [])])})
                items.append(
                    {"text": b, "person": p.get("name"), "meeting_id": m.id, "at": m.started_at, "entities": ents}
                )
    groups: list[dict] = []
    for it in items:
        home = None
        for g in groups:
            if set(it["entities"]) & set(g["entities"]) or any(
                similarity(it["text"], x["text"]) >= 0.4 for x in g["items"]
            ):
                home = g
                break
        if home is None:
            home = {"entities": set(), "items": []}
            groups.append(home)
        home["items"].append(it)
        home["entities"] |= set(it["entities"])
    out = []
    for g in groups:
        standups = {x["meeting_id"] for x in g["items"]}
        if len(standups) < min_standups:
            continue
        first, last = min(x["at"] for x in g["items"]), max(x["at"] for x in g["items"])
        people_ = sorted({x["person"] for x in g["items"] if x["person"]})
        words = tokens(" ".join(x["text"] for x in g["items"]))
        topic = ", ".join(sorted(g["entities"])) or max(g["items"], key=lambda x: len(x["text"]))["text"]
        out.append(
            {
                "topic": topic,
                "entities": sorted(g["entities"]),
                "standups": len(standups),
                "people": people_,
                "first_seen": first.isoformat(),
                "last_seen": last.isoformat(),
                "days_open": (last - first).days,
                "examples": [x["text"] for x in g["items"][-3:]],
                "nudge": f"{topic} has blocked {', '.join(people_) or 'someone'} in {len(standups)} standups since "
                f"{first:%b %d}. Worth a dependency check with the owning team?",
                "keywords": sorted(words)[:8],
            }
        )
    return sorted(out, key=lambda x: (-x["standups"], x["topic"]))
