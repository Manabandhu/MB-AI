"""The pre-meeting brief: built from the invite, the attendees, linked docs, the last meeting with the
same people, and open commitments. Each profile adds its own context (the live-assist column of the
profile table): 1:1 open items, a client's past promises and figures, runbooks and similar incidents,
prior decisions on the topic, or your pre-filled standup update.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import Principal
from ..config import Settings
from ..models import (
    Commitment,
    CommitmentStatus,
    Decision,
    Meeting,
    MeetingStatus,
    Person,
    Speaker,
    Summary,
)
from ..pipeline.memory import is_stuck, similarity
from ..pipeline.people import attendee_people
from ..pipeline.profiles import get_profile
from ..providers import LLM, Embedder, ProviderError
from ..retrieval import document_sources, summary_text


def _meeting_ref(m: Meeting) -> dict:
    return {"id": m.id, "title": m.title, "started_at": m.started_at.isoformat(), "profile": m.profile}


def _commitment_ref(c: Commitment, now: datetime) -> dict:
    return {
        "id": c.id,
        "owner": c.owner,
        "text": c.text,
        "due": c.due,
        "due_date": c.due_date.isoformat() if c.due_date else None,
        "stuck": is_stuck(c, now),
        "meeting_id": c.last_meeting_id,
    }


def _meetings_with(db: Session, person_id: str, before: datetime, exclude: str | None) -> list[Meeting]:
    sub = select(Speaker.meeting_id).where(Speaker.person_id == person_id)
    stmt = (
        select(Meeting)
        .where(Meeting.id.in_(sub), Meeting.status == MeetingStatus.DONE, Meeting.started_at < before)
        .order_by(Meeting.started_at.desc())
    )
    return [m for m in db.scalars(stmt.limit(6)) if m.id != exclude]


def build_brief(
    db: Session,
    meeting: Meeting,
    principal: Principal,
    settings: Settings,
    *,
    llm: LLM | None = None,
    embedder: Embedder | None = None,
    now: datetime | None = None,
) -> dict:
    now = now or datetime.now(UTC)
    profile = get_profile(meeting.profile, db)
    me = {p.id for p in db.scalars(select(Person).where(Person.account_user_id == principal.user_id))}
    people = [p for p in attendee_people(db, meeting.attendees or []) if p.id not in me]
    db.flush()
    open_commitments = db.scalars(
        select(Commitment).where(Commitment.status == CommitmentStatus.OPEN).order_by(Commitment.last_mentioned_at)
    ).all()

    attendees = []
    shared: dict[str, int] = {}
    for p in people:
        history = _meetings_with(db, p.id, now, meeting.id)
        for m in history:
            shared[m.id] = shared.get(m.id, 0) + 1
        theirs = [
            c
            for c in open_commitments
            if c.owner_person_id == p.id or (c.owner or "").lower() == p.display_name.lower()
        ]
        attendees.append(
            {
                "person_id": p.id,
                "name": p.display_name,
                "email": p.email,
                "has_voiceprint": p.consent_at is not None,
                "last_meeting": _meeting_ref(history[0]) if history else None,
                "meetings_together": len(history),
                "open_commitments": [_commitment_ref(c, now) for c in theirs[:5]],
            }
        )

    mine = [
        _commitment_ref(c, now)
        for c in open_commitments
        if c.owner_person_id in me or (c.owner or "").lower() == principal.display_name.lower()
    ]

    last_same = None
    if shared:
        best_id = max(shared, key=lambda k: (shared[k], db.get(Meeting, k).started_at))
        m = db.get(Meeting, best_id)
        s = db.get(Summary, best_id)
        last_same = {**_meeting_ref(m), "overview": (s.data.get("overview") if s else None)}

    brief: dict = {
        "meeting": _meeting_ref(meeting),
        "profile": {"key": profile.key, "label": profile.label, "live_assist": profile.live_assist},
        "attendees": attendees,
        "your_open_commitments": mine[:8],
        "last_meeting_with_them": last_same,
        "linked_docs": meeting.links or [],
        "focus": [],
    }

    # Profile-specific context ------------------------------------------------------------------
    focus: list[dict] = []
    if profile.key == "one_on_one" and last_same:
        s = db.get(Summary, last_same["id"])
        fields = (s.data.get("fields") or {}) if s else {}
        for item in fields.get("follow_ups", []):
            focus.append({"kind": "open_item", "text": item, "meeting_id": last_same["id"]})
        for a in attendees:
            for c in a["open_commitments"]:
                focus.append(
                    {"kind": "their_commitment", "text": f"{c['owner']}: {c['text']}", "meeting_id": c["meeting_id"]}
                )
    elif profile.key in ("client_call", "phone_call"):
        for a in attendees:
            for c in a["open_commitments"]:
                focus.append(
                    {"kind": "promise", "text": f"{c['owner']} promised: {c['text']}", "meeting_id": c["meeting_id"]}
                )
            if a["last_meeting"]:
                s = db.get(Summary, a["last_meeting"]["id"])
                for fig in (s.data.get("fields") or {}).get("figures", []) if s else []:
                    focus.append({"kind": "figure", "text": fig, "meeting_id": a["last_meeting"]["id"]})
    elif profile.key == "incident":
        past = db.scalars(
            select(Meeting)
            .where(Meeting.profile == "incident", Meeting.status == MeetingStatus.DONE, Meeting.id != meeting.id)
            .order_by(Meeting.started_at.desc())
            .limit(50)
        ).all()
        ranked = sorted(past, key=lambda m: similarity(m.title, meeting.title), reverse=True)[:3]
        for m in ranked:
            if similarity(m.title, meeting.title) > 0:
                s = db.get(Summary, m.id)
                focus.append(
                    {
                        "kind": "similar_incident",
                        "text": f"{m.title}: {(s.data.get('overview') if s else '')}",
                        "meeting_id": m.id,
                    }
                )
        if embedder is not None:
            try:
                for d in document_sources(db, embedder, meeting.title, "runbook", limit=3):
                    focus.append({"kind": "runbook", "text": d.meeting_title, "url": d.url})
            except ProviderError:
                pass
    elif profile.key == "planning":
        decisions = db.execute(
            select(Decision, Meeting.title)
            .join(Meeting, Meeting.id == Decision.meeting_id)
            .order_by(Decision.decided_at.desc())
            .limit(200)
        ).all()
        ranked = sorted(decisions, key=lambda r: similarity(r[0].text + " " + r[1], meeting.title), reverse=True)
        for d, title in ranked[:5]:
            if similarity(d.text + " " + title, meeting.title) > 0:
                focus.append({"kind": "prior_decision", "text": d.text, "meeting_id": d.meeting_id, "at": d.at})
    elif profile.key == "standup" and llm is not None:
        from .standup import draft_standup

        draft = draft_standup(db, principal, llm, settings, now)
        focus.append(
            {
                "kind": "your_update",
                "text": draft["text"],
                "draft": {k: draft[k] for k in ("yesterday", "today", "blockers")},
            }
        )
    if last_same and not focus:
        s = db.get(Summary, last_same["id"])
        if s:
            focus.append({"kind": "last_time", "text": summary_text(s.data)[:600], "meeting_id": last_same["id"]})
    brief["focus"] = focus
    return brief
