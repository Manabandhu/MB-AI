"""Meeting-type profiles: what the summary contains and what live assist does for each kind of meeting.

A profile is a summary template plus a live-assist behaviour. Every summary has the common shape
(overview, key points, decisions, action items, open questions, entities); a profile adds its own
`fields` (e.g. risks for a client call, a timeline for an incident) and, for standups, per-person
updates. Custom profiles are a prompt plus a field list, stored per workspace.
"""

import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session


@dataclass(frozen=True)
class FieldSpec:
    key: str
    label: str
    hint: str
    type: str = "list"  # list (of short strings) | text (one block)

    def as_dict(self) -> dict:
        return {"key": self.key, "label": self.label, "hint": self.hint, "type": self.type}


@dataclass(frozen=True)
class Profile:
    key: str
    label: str
    instructions: str
    per_person: bool = False  # fill "people" with yesterday/today/blockers
    fields: tuple[FieldSpec, ...] = ()
    live_assist: str = ""  # what the live card focuses on for this meeting type
    keywords: tuple[str, ...] = ()  # title/opening words that suggest this profile
    retrieve_profiles: tuple[str, ...] = ()  # live retrieval prefers these meeting types ("" = any)
    custom: bool = False

    def as_dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "per_person": self.per_person,
            "fields": [f.as_dict() for f in self.fields],
            "live_assist": self.live_assist,
            "custom": self.custom,
        }


PROFILES: dict[str, Profile] = {
    p.key: p
    for p in [
        Profile(
            key="standup",
            label="Standup",
            per_person=True,
            instructions=(
                "This is a daily standup. For every person who gave an update, list what they did "
                "yesterday (or since the last standup), what they plan to do today, and any blockers. "
                "Use short phrases in their own terms; keep system, ticket and project names exactly as said. "
                "Put discussion that is not part of someone's update into key_points. Anything someone "
                "says they will do today is also an action item with them as owner."
            ),
            live_assist="Your update, pre-filled from yesterday's commitments and your Jira, GitHub and CI activity.",
            keywords=("standup", "stand-up", "daily", "scrum", "sync-up", "dsm"),
            retrieve_profiles=("standup",),
        ),
        Profile(
            key="one_on_one",
            label="1:1",
            instructions=(
                "This is a one-on-one. Capture feedback given in either direction, decisions, and follow-ups. "
                "Note career, workload or wellbeing topics only as briefly as they were raised."
            ),
            fields=(
                FieldSpec("feedback", "Feedback", "feedback given or received, attributed to who gave it"),
                FieldSpec("follow_ups", "Follow-ups", "things to revisit at the next 1:1"),
            ),
            live_assist="Agenda and open items from your last 1:1 with this person.",
            keywords=("1:1", "1-1", "1on1", "one on one", "one-on-one", "catch up", "catch-up", "check-in"),
            retrieve_profiles=("one_on_one",),
        ),
        Profile(
            key="client_call",
            label="Client / vendor call",
            instructions=(
                "This is a call with a client or vendor. Capture decisions, every commitment made by either "
                "side with its owner and date, risks raised, and any figures (prices, volumes, dates, SLAs) "
                "exactly as stated."
            ),
            fields=(
                FieldSpec("risks", "Risks", "risks or concerns raised, one line each"),
                FieldSpec("figures", "Figures", "numbers, prices, volumes, dates or SLAs exactly as stated"),
                FieldSpec("their_commitments", "What they committed to", "commitments made by the other side"),
            ),
            live_assist="Past promises, figures and contract facts from earlier calls with these people.",
            keywords=("client", "customer", "vendor", "supplier", "partner", "account", "qbr", "renewal", "sales"),
            retrieve_profiles=("client_call", "phone_call"),
        ),
        Profile(
            key="incident",
            label="Incident bridge",
            instructions=(
                "This is an incident bridge. Build a timeline of what happened and what was done, with "
                "timestamps. Capture current impact, hypotheses, actions with owners, and the agreed next update."
            ),
            fields=(
                FieldSpec("timeline", "Timeline", "'m:ss — event' lines in order: detection, actions, findings"),
                FieldSpec("impact", "Impact", "who or what is affected, and how badly"),
                FieldSpec("hypotheses", "Hypotheses", "suspected causes, and whether confirmed or ruled out"),
            ),
            live_assist="Related runbooks and similar past incidents.",
            keywords=("incident", "outage", "sev1", "sev 1", "sev2", "p1", "bridge", "war room", "postmortem", "down"),
            retrieve_profiles=("incident",),
        ),
        Profile(
            key="planning",
            label="Planning / design review",
            instructions=(
                "This is a planning or design review. Capture decisions with their rationale, options that were "
                "rejected and why, open questions, and draft an Architecture Decision Record for the main decision."
            ),
            fields=(
                FieldSpec("options", "Options considered", "each option and why it was chosen or rejected"),
                FieldSpec(
                    "draft_adr",
                    "Draft ADR",
                    "Markdown with Context, Decision and Consequences sections, only from what was said",
                    "text",
                ),
            ),
            live_assist="Prior decisions on the same topic.",
            keywords=(
                "planning",
                "design review",
                "architecture",
                "adr",
                "rfc",
                "roadmap",
                "sprint planning",
                "grooming",
                "refinement",
                "kickoff",
            ),  # fmt: skip
            retrieve_profiles=("planning",),
        ),
        Profile(
            key="interview",
            label="Interview",
            instructions=(
                "This is an interview, recorded with everyone's knowledge. Log each question and the gist of the "
                "answer, and fill a scorecard only with evidence that was actually heard. Do not judge the candidate "
                "beyond that evidence."
            ),
            fields=(
                FieldSpec("qa_log", "Q&A log", "'Q: … — A: …' one line per question"),
                FieldSpec("scorecard", "Scorecard", "'criterion: evidence heard' lines, no ratings invented"),
            ),
            live_assist="Talking points from your own experience (your past meetings and docs).",
            keywords=("interview", "screen", "candidate", "hiring", "loop", "panel"),
            retrieve_profiles=("",),
        ),
        Profile(
            key="in_person",
            label="In-person / hallway",
            instructions="This is an informal in-person conversation. Capture the key points and any to-dos.",
            live_assist="Who you're talking to and your history with them.",
            keywords=("hallway", "coffee", "lunch", "walk", "in person", "in-person", "chat with"),
            retrieve_profiles=("",),
        ),
        Profile(
            key="phone_call",
            label="Phone call",
            instructions="This is a phone call. Summarize it briefly and list the follow-ups with owners.",
            fields=(FieldSpec("follow_ups", "Follow-ups", "what needs to happen next, and who does it"),),
            live_assist="Past promises, figures and contract facts, as for a client call.",
            keywords=("call with", "phone", "dial-in", "dial in"),
            retrieve_profiles=("client_call", "phone_call"),
        ),
        Profile(
            key="general",
            label="General meeting",
            instructions=(
                "Summarize the meeting: the main points discussed, decisions made, action items with owners, "
                "and questions left open. Leave 'people' empty."
            ),
            live_assist="Grounded answers from any of your past meetings.",
            retrieve_profiles=("",),
        ),
    ]
}

AUTO = "auto"


def custom_profiles(session: Session | None) -> dict[str, Profile]:
    if session is None:
        return {}
    from ..models import CustomProfile

    out = {}
    for c in session.scalars(select(CustomProfile)).all():
        fields = tuple(
            FieldSpec(f["key"], f.get("label") or f["key"], f.get("hint", ""), f.get("type", "list"))
            for f in (c.fields or [])
            if f.get("key")
        )
        out[c.key] = Profile(
            key=c.key, label=c.label, instructions=c.instructions, per_person=c.per_person, fields=fields,
            live_assist=c.live_prompt, keywords=tuple(c.keywords or []), retrieve_profiles=("",), custom=True,
        )  # fmt: skip
    return out


def all_profiles(session: Session | None = None) -> dict[str, Profile]:
    return {**PROFILES, **custom_profiles(session)}


def get_profile(key: str, session: Session | None = None) -> Profile:
    profiles = all_profiles(session)
    return profiles.get(key, PROFILES["general"])


def profile_exists(key: str, session: Session | None = None) -> bool:
    return key == AUTO or key in all_profiles(session)


# ------------------------------------------------------------------------------- auto-detection


def _hits(text: str, keywords: tuple[str, ...]) -> int:
    text = f" {text.lower()} "
    return sum(1 for k in keywords if re.search(rf"(?<![a-z0-9]){re.escape(k.lower())}(?![a-z0-9])", text))


def detect_profile(
    title: str, attendees: list[str] | None = None, opening: str = "", session: Session | None = None
) -> tuple[str, float]:
    """Pick a profile from the calendar title, the attendees and the first couple of minutes.

    Title words weigh most. Exactly two people (you plus one) with no other signal suggests a 1:1.
    Returns (profile key, confidence 0..1). Falls back to "general".
    """
    scores: dict[str, float] = {}
    for key, p in all_profiles(session).items():
        if not p.keywords:
            continue
        s = 3.0 * _hits(title, p.keywords) + 1.0 * _hits(opening[:3000], p.keywords)
        if s:
            scores[key] = s
    n_people = len([a for a in attendees or [] if a.strip()])
    if n_people == 1 and not scores:  # attendees list is everyone but you
        scores["one_on_one"] = 1.5
    if not scores:
        return "general", 0.0
    key, best = max(scores.items(), key=lambda kv: kv[1])
    return key, round(min(1.0, best / 6.0), 2)
