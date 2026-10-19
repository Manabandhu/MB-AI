"""The people directory: anyone seen in a meeting, matched by name, alias or email."""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Person

_GENERIC = re.compile(r"^(speaker|guest|unknown|participant)\b", re.I)


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip().lower()


def is_generic_name(name: str) -> bool:
    """ "Speaker 2", "Guest", "Unknown": labels, not people."""
    return not name.strip() or bool(_GENERIC.match(name.strip()))


def split_attendee(text: str) -> tuple[str, str | None]:
    """ "Priya Rao <priya@corp.com>" -> ("Priya Rao", "priya@corp.com"); "priya@corp.com" -> ("priya", ...)."""
    text = text.strip()
    m = re.match(r"^(.*?)\s*<([^>]+@[^>]+)>$", text)
    if m:
        return (m.group(1).strip() or m.group(2).split("@")[0]), m.group(2).strip().lower()
    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", text):
        return text.split("@")[0].replace(".", " ").title(), text.lower()
    return text, None


def find_person(session: Session, name: str | None = None, email: str | None = None) -> Person | None:
    people = session.scalars(select(Person)).all()
    if email:
        for p in people:
            if p.email and p.email.lower() == email.lower():
                return p
    if name:
        key = _norm(name)
        for p in people:
            if _norm(p.display_name) == key or key in {_norm(a) for a in (p.aliases or [])}:
                return p
    return None


def ensure_person(session: Session, name: str, email: str | None = None) -> Person | None:
    if is_generic_name(name):
        return None
    person = find_person(session, name, email)
    if person is None:
        person = Person(display_name=name.strip()[:120], email=email, aliases=[])
        session.add(person)
        session.flush()
    elif email and not person.email:
        person.email = email
    return person


def attendee_people(session: Session, attendees: list[str]) -> list[Person]:
    out: list[Person] = []
    for a in attendees or []:
        name, email = split_attendee(a)
        person = ensure_person(session, name, email)
        if person is not None and person not in out:
            out.append(person)
    return out


def person_names(person: Person) -> list[str]:
    return [person.display_name, *(person.aliases or [])]
