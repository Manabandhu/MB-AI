"""Per-workspace memory, updated after every summary: entities, decisions and commitments.

Commitments are tracked across meetings. An action item that matches an open commitment of the same
owner adds a mention to it ("you said X would be done Wednesday"); otherwise it starts a new one.
In standups, a "yesterday" item that matches one of that person's open commitments closes it.
An open commitment mentioned in two or more meetings over three or more days is "stuck".

Re-summarizing a meeting first removes everything that meeting contributed, so memory never
double-counts.
"""

import logging
import re
from datetime import date, datetime, timedelta

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from ..models import (
    ActionItem,
    Commitment,
    CommitmentMention,
    CommitmentStatus,
    Decision,
    Entity,
    EntityMention,
    GlossaryTerm,
    Meeting,
    Person,
)
from .people import find_person, is_generic_name
from .summarize import MeetingSummary
from .transcript import Line

log = logging.getLogger(__name__)

MATCH_THRESHOLD = 0.5
DONE_THRESHOLD = 0.5
STUCK_AFTER = timedelta(days=3)

_STOP = set(
    "a an the to of and or for on in at by with from this that it is be will i i'll we we'll you my our your "
    "me us do get got have has had am are was were can could should would just also then so up out today "
    "tomorrow yesterday by eod end week".split()
)
_WORD = re.compile(r"[a-z0-9][a-z0-9'-]*")
_WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]


def tokens(text: str) -> set[str]:
    out = set()
    for w in _WORD.findall(text.lower()):
        w = w.strip("'-")
        if w and w not in _STOP:
            out.add(w[:-1] if len(w) > 4 and w.endswith("s") else w)  # crude plural folding
    return out


def similarity(a: str, b: str) -> float:
    """Overlap of meaningful words, relative to the shorter text (so a re-phrased update still matches)."""
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))


def resolve_due(due: str | None, said_on: date) -> date | None:
    """'Wednesday', 'tomorrow', 'end of week', 'next week', 'Oct 24', '2026-10-24' -> a date."""
    if not due:
        return None
    s = due.lower().strip()
    if m := re.search(r"(\d{4})-(\d{2})-(\d{2})", s):
        try:
            return date(int(m[1]), int(m[2]), int(m[3]))
        except ValueError:
            return None
    if "today" in s or "eod" in s or "end of day" in s:
        return said_on
    if "tomorrow" in s:
        return said_on + timedelta(days=1)
    if "next week" in s:
        return said_on + timedelta(days=7 - said_on.weekday())
    if "end of week" in s or "eow" in s or "this week" in s:
        return said_on + timedelta(days=max(0, 4 - said_on.weekday()))
    for i, day in enumerate(_WEEKDAYS):
        if day in s or re.search(rf"\b{day[:3]}\b", s):
            ahead = (i - said_on.weekday()) % 7 or 7
            if "next" in s and ahead < 7:
                ahead += 7
            return said_on + timedelta(days=ahead)
    if m := re.search(r"\b(" + "|".join(_MONTHS) + r")[a-z]*\.?\s+(\d{1,2})\b", s):
        month, day = _MONTHS.index(m[1]) + 1, int(m[2])
        for year in (said_on.year, said_on.year + 1):
            try:
                d = date(year, month, day)
            except ValueError:
                return None
            if d >= said_on - timedelta(days=31):
                return d
    return None


def is_stuck(c: Commitment, now: datetime) -> bool:
    return c.status == CommitmentStatus.OPEN and c.mention_count >= 2 and now - c.first_mentioned_at >= STUCK_AFTER


def is_overdue(c: Commitment, today: date) -> bool:
    return c.status == CommitmentStatus.OPEN and c.due_date is not None and c.due_date < today


# ----------------------------------------------------------------------------------- entities


def _mention_count(name: str, text: str) -> int:
    return len(re.findall(rf"(?<![\w]){re.escape(name.lower())}(?![\w])", text))


def _upsert_entity(session: Session, kind: str, name: str) -> Entity:
    key = name.strip().lower()
    for e in session.scalars(select(Entity)).all():
        if e.name.lower() == key or key in {a.lower() for a in (e.aliases or [])}:
            return e
    e = Entity(kind=kind, name=name.strip()[:200], aliases=[])
    session.add(e)
    session.flush()
    return e


def update_entities(session: Session, meeting: Meeting, summary: MeetingSummary, lines: list[Line]) -> None:
    session.execute(delete(EntityMention).where(EntityMention.meeting_id == meeting.id))
    found: dict[int, Entity] = {}
    for ent in summary.entities:
        if ent.name.strip() and not is_generic_name(ent.name):
            e = _upsert_entity(session, ent.kind, ent.name)
            found[e.id] = e
    # Glossary terms of an entity kind are entities too, whenever they are said.
    full_text = " ".join(ln.text for ln in lines).lower()
    for term in session.scalars(select(GlossaryTerm).where(GlossaryTerm.kind != "term")).all():
        if any(_mention_count(n, full_text) for n in [term.term, *(term.aliases or [])]):
            e = _upsert_entity(session, term.kind, term.term)
            found[e.id] = e
    for e in found.values():
        names = [e.name, *(e.aliases or [])]
        first = next((ln.start for ln in lines if any(_mention_count(n, ln.text.lower()) for n in names)), None)
        count = sum(_mention_count(n, full_text) for n in names)
        session.add(EntityMention(entity_id=e.id, meeting_id=meeting.id, first_at=first, count=max(1, count)))


# ---------------------------------------------------------------------------------- decisions


def update_decisions(session: Session, meeting: Meeting, summary: MeetingSummary) -> None:
    session.execute(delete(Decision).where(Decision.meeting_id == meeting.id))
    for d in summary.decisions:
        if not d.text.strip():
            continue
        owner = find_person(session, d.owner) if d.owner else None
        session.add(
            Decision(
                meeting_id=meeting.id,
                text=d.text.strip(),
                owner=d.owner,
                owner_person_id=owner.id if owner else None,
                decided_at=meeting.started_at,
                at=d.at,
            )  # fmt: skip
        )


# -------------------------------------------------------------------------------- commitments


def _refresh(session: Session, c: Commitment) -> bool:
    """Recompute first/last/mention_count from mentions. Returns False when nothing is left."""
    rows = session.execute(
        select(CommitmentMention.said_at, CommitmentMention.meeting_id, CommitmentMention.kind)
        .where(CommitmentMention.commitment_id == c.id)
        .order_by(CommitmentMention.said_at)
    ).all()
    made = [r for r in rows if r.kind != "done"]
    if not made:
        return False
    c.first_mentioned_at, c.first_meeting_id = made[0].said_at, made[0].meeting_id
    c.last_mentioned_at, c.last_meeting_id = rows[-1].said_at, rows[-1].meeting_id
    c.mention_count = len(made)
    return True


def forget_meeting(session: Session, meeting: Meeting) -> None:
    """Undo this meeting's contribution to commitments (before re-summarizing or deleting it)."""
    mentions = session.scalars(select(CommitmentMention).where(CommitmentMention.meeting_id == meeting.id)).all()
    touched = {m.commitment_id for m in mentions}
    reopened = {m.commitment_id for m in mentions if m.kind == "done"}
    session.execute(delete(CommitmentMention).where(CommitmentMention.meeting_id == meeting.id))
    session.flush()
    for cid in touched:
        c = session.get(Commitment, cid)
        if c is None:
            continue
        if cid in reopened and c.status == CommitmentStatus.DONE and c.done_at == meeting.started_at:
            c.status, c.done_at = CommitmentStatus.OPEN, None
            session.execute(update(ActionItem).where(ActionItem.commitment_id == cid).values(done=False))
        if not _refresh(session, c):
            session.delete(c)
    session.flush()


def _owner_key(session: Session, name: str | None) -> tuple[str | None, Person | None]:
    if not name or is_generic_name(name):
        return name, None
    return name, find_person(session, name)


def _same_owner(c: Commitment, name: str | None, person: Person | None) -> bool:
    if person is not None and c.owner_person_id:
        return c.owner_person_id == person.id
    return (c.owner or "").strip().lower() == (name or "").strip().lower()


def update_commitments(session: Session, meeting: Meeting, summary: MeetingSummary, items: list[ActionItem]) -> None:
    forget_meeting(session, meeting)
    open_items = session.scalars(select(Commitment).where(Commitment.status == CommitmentStatus.OPEN)).all()
    said_on = meeting.started_at.date()

    # Standups: yesterday's work closes matching open commitments of the same person.
    for p in summary.people:
        name, person = _owner_key(session, p.name)
        for done_text in p.yesterday:
            best = max(
                (c for c in open_items if _same_owner(c, name, person) and c.first_meeting_id != meeting.id),
                key=lambda c: similarity(c.text, done_text),
                default=None,
            )
            if best is not None and similarity(best.text, done_text) >= DONE_THRESHOLD:
                best.status, best.done_at = CommitmentStatus.DONE, meeting.started_at
                session.execute(update(ActionItem).where(ActionItem.commitment_id == best.id).values(done=True))
                session.add(
                    CommitmentMention(
                        commitment_id=best.id, meeting_id=meeting.id, said_at=meeting.started_at, kind="done"
                    )  # fmt: skip
                )
                session.flush()
                open_items = [c for c in open_items if c.id != best.id]

    for item in items:
        name, person = _owner_key(session, item.owner)
        candidates = [c for c in open_items if _same_owner(c, name, person)]
        best = max(candidates, key=lambda c: similarity(c.text, item.text), default=None)
        if best is not None and similarity(best.text, item.text) >= MATCH_THRESHOLD:
            c = best
            if item.due:
                c.due, c.due_date = item.due, resolve_due(item.due, said_on) or c.due_date
        else:
            c = Commitment(
                owner=name, owner_person_id=person.id if person else None, text=item.text, due=item.due,
                due_date=resolve_due(item.due, said_on), status=CommitmentStatus.OPEN,
                first_meeting_id=meeting.id, last_meeting_id=meeting.id, first_mentioned_at=meeting.started_at,
                last_mentioned_at=meeting.started_at, mention_count=0,
            )  # fmt: skip
            session.add(c)
            session.flush()
            open_items.append(c)
        exists = session.scalars(
            select(CommitmentMention).where(
                CommitmentMention.commitment_id == c.id, CommitmentMention.meeting_id == meeting.id
            )
        ).first()
        if exists is None:
            kind = "made" if c.first_meeting_id == meeting.id else "progress"
            session.add(
                CommitmentMention(
                    commitment_id=c.id, meeting_id=meeting.id, said_at=meeting.started_at, at=item.at, kind=kind
                )  # fmt: skip
            )
            session.flush()
        _refresh(session, c)
        item.commitment_id = c.id
        if item.done is False and c.status == CommitmentStatus.DONE:
            item.done = True


def update_memory(
    session: Session, meeting: Meeting, summary: MeetingSummary, items: list[ActionItem], lines: list[Line]
) -> None:
    update_entities(session, meeting, summary, lines)
    update_decisions(session, meeting, summary)
    update_commitments(session, meeting, summary, items)
    session.flush()
