"""Upcoming meetings from a calendar feed (an ICS/webcal URL from Outlook, Google or any CalDAV server).

Each event gets a detected profile and its meeting link, and can be prepared: a meeting row is
created with the attendees, links and profile, and the pre-meeting brief is built from it.
"""

import re
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta

import httpx

_LINK = re.compile(
    r"https://(?:[\w.-]+\.)?(?:zoom\.us|teams\.microsoft\.com|teams\.live\.com|meet\.google\.com)/[^\s\"'<>]+"
)
_URL = re.compile(r"https?://[^\s\"'<>]+")


@dataclass
class CalendarEvent:
    uid: str
    title: str
    start: datetime
    end: datetime | None
    attendees: list[str] = field(default_factory=list)
    organizer: str | None = None
    location: str = ""
    description: str = ""
    meeting_url: str | None = None
    links: list[str] = field(default_factory=list)

    @property
    def key(self) -> str:
        """Unique per occurrence of a recurring event."""
        return f"{self.uid}@{self.start.isoformat()}"


def _dt(value) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=UTC)
    raise ValueError(f"unsupported date {value!r}")


def _person(prop) -> str:
    cn = prop.params.get("CN") if hasattr(prop, "params") else None
    email = str(prop).replace("mailto:", "").replace("MAILTO:", "").strip()
    if cn and email and "@" in email:
        return f"{cn} <{email}>"
    return cn or email


def parse_ics(text: str, since: datetime, until: datetime) -> list[CalendarEvent]:
    import icalendar
    import recurring_ical_events

    cal = icalendar.Calendar.from_ical(text)
    out = []
    for ev in recurring_ical_events.of(cal).between(since, until):
        if str(ev.get("STATUS", "")).upper() == "CANCELLED":
            continue
        start = _dt(ev.decoded("DTSTART"))
        end = _dt(ev.decoded("DTEND")) if ev.get("DTEND") else None
        attendees = ev.get("ATTENDEE") or []
        if not isinstance(attendees, list):
            attendees = [attendees]
        desc, loc = str(ev.get("DESCRIPTION", "")), str(ev.get("LOCATION", ""))
        blob = " ".join([loc, desc, str(ev.get("URL", ""))])
        link = _LINK.search(blob)
        out.append(
            CalendarEvent(
                uid=str(ev.get("UID", "")),
                title=str(ev.get("SUMMARY", "Untitled")),
                start=start,
                end=end,
                attendees=[_person(a) for a in attendees if str(a).strip()],
                organizer=_person(ev["ORGANIZER"]) if ev.get("ORGANIZER") else None,
                location=loc,
                description=desc[:4000],
                meeting_url=link.group(0) if link else None,
                links=[u for u in dict.fromkeys(_URL.findall(blob)) if not _LINK.match(u)][:10],
            )
        )
    return sorted(out, key=lambda e: e.start)


def fetch_events(url: str, days: int = 7, now: datetime | None = None, http: httpx.Client | None = None):
    now = now or datetime.now(UTC)
    if url.startswith("webcal://"):
        url = "https://" + url[len("webcal://") :]
    http = http or httpx.Client(timeout=20.0, follow_redirects=True)
    r = http.get(url)
    if r.status_code >= 400:
        raise RuntimeError(f"calendar feed returned {r.status_code}")
    return parse_ics(r.text, now - timedelta(hours=2), now + timedelta(days=days))
