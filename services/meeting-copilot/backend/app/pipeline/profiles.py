"""Meeting-type profiles: what the summary should contain for each kind of meeting.

Phase 1 ships "standup" and "general". Add a profile by adding an entry here; the UI picks it up
from /api/config.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Profile:
    key: str
    label: str
    instructions: str
    per_person: bool  # fill "people" with yesterday/today/blockers


PROFILES: dict[str, Profile] = {
    "standup": Profile(
        key="standup",
        label="Standup",
        per_person=True,
        instructions=(
            "This is a daily standup. For every person who gave an update, list what they did "
            "yesterday (or since the last standup), what they plan to do today, and any blockers. "
            "Use short phrases in their own terms; keep system, ticket and project names exactly as said. "
            "Put discussion that is not part of someone's update into key_points."
        ),
    ),
    "general": Profile(
        key="general",
        label="General meeting",
        per_person=False,
        instructions=(
            "Summarize the meeting: the main points discussed, decisions made, action items with owners, "
            "and questions left open. Leave 'people' empty."
        ),
    ),
}


def get_profile(key: str) -> Profile:
    return PROFILES.get(key, PROFILES["general"])
