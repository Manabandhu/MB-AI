"""Turn a transcript into the profile's structured summary using the configured LLM.

Long transcripts are condensed in windows first (map), then summarized once (reduce), so the
same code works with a 32k-context local model and a 200k-context hosted one.
"""

import json
import logging
import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from ..providers.llm import LLM
from ..providers.types import ProviderError
from .profiles import Profile

log = logging.getLogger(__name__)


def _to_seconds(v) -> float | None:
    """Accept 125, 125.0, "125", "2:05" or "02:05" and return seconds."""
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().strip("[]")
    m = re.fullmatch(r"(?:(\d+):)?(\d+):(\d{2})", s)
    if m:
        h, mm, ss = m.groups()
        return int(h or 0) * 3600 + int(mm) * 60 + int(ss)
    try:
        return float(s)
    except ValueError:
        return None


class _Lenient(BaseModel):
    model_config = ConfigDict(extra="ignore")


class PersonUpdate(_Lenient):
    name: str
    yesterday: list[str] = Field(default_factory=list)
    today: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)


class KeyPoint(_Lenient):
    text: str
    at: float | None = None

    @field_validator("at", mode="before")
    @classmethod
    def coerce_at(cls, v):
        return _to_seconds(v)


class ActionItemOut(_Lenient):
    owner: str | None = None
    text: str
    due: str | None = None
    at: float | None = None

    @field_validator("at", mode="before")
    @classmethod
    def coerce_at(cls, v):
        return _to_seconds(v)


class DecisionOut(_Lenient):
    text: str
    owner: str | None = None
    at: float | None = None

    @field_validator("at", mode="before")
    @classmethod
    def coerce_at(cls, v):
        return _to_seconds(v)


ENTITY_KINDS = ("project", "system", "org", "topic")


class EntityOut(_Lenient):
    kind: str = "topic"
    name: str

    @field_validator("kind", mode="before")
    @classmethod
    def coerce_kind(cls, v):
        v = str(v or "topic").lower().strip()
        return v if v in ENTITY_KINDS else "topic"


class MeetingSummary(_Lenient):
    overview: str = ""
    people: list[PersonUpdate] = Field(default_factory=list)
    key_points: list[KeyPoint] = Field(default_factory=list)
    decisions: list[DecisionOut] = Field(default_factory=list)
    action_items: list[ActionItemOut] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    entities: list[EntityOut] = Field(default_factory=list)
    fields: dict = Field(default_factory=dict)  # profile-specific: {"risks": [...], "draft_adr": "..."}

    @field_validator("decisions", mode="before")
    @classmethod
    def coerce_decisions(cls, v):
        return [{"text": d} if isinstance(d, str) else d for d in (v or [])]

    @field_validator("entities", mode="before")
    @classmethod
    def coerce_entities(cls, v):
        return [{"name": e} if isinstance(e, str) else e for e in (v or [])]

    @field_validator("fields", mode="before")
    @classmethod
    def coerce_fields(cls, v):
        return v if isinstance(v, dict) else {}

    @field_validator("key_points", mode="before")
    @classmethod
    def coerce_points(cls, v):  # models sometimes return plain strings
        return [{"text": p} if isinstance(p, str) else p for p in (v or [])]

    @field_validator("action_items", mode="before")
    @classmethod
    def coerce_actions(cls, v):
        return [{"text": a} if isinstance(a, str) else a for a in (v or [])]


SCHEMA_HINT = """{
  "overview": "2-3 sentences",
  "people": [{"name": "...", "yesterday": ["..."], "today": ["..."], "blockers": ["..."]}],
  "key_points": [{"text": "...", "at": "m:ss"}],
  "decisions": [{"text": "...", "owner": "name or null", "at": "m:ss"}],
  "action_items": [{"owner": "name or null", "text": "...", "due": "as said, or null", "at": "m:ss"}],
  "open_questions": ["..."],
  "entities": [{"kind": "project|system|org|topic", "name": "as said"}],
  "fields": {FIELDS}
}"""

SUMMARY_SYSTEM = """TASK: summarize-meeting
You turn meeting transcripts into accurate structured notes.
Rules:
- Use only what is in the transcript. Never invent names, numbers, dates or commitments.
- Speaker names come from the transcript labels. Labels like "Speaker 2" are unknown people; keep them as-is.
- "at" is the [m:ss] timestamp of the line where the item was said.
- An action item is anything someone commits to do ("I'll send", "I will fix by Friday"); the owner is who said it.
- "entities" are the projects, systems, organisations and topics the meeting talks about, spelled as said.
- Empty lists are fine. Keep every list item to one short line.
- Return a single JSON object matching this shape, with no prose before or after:
"""


def schema_for(profile: Profile) -> str:
    fields = ", ".join(
        f'"{f.key}": ' + ('"..."' if f.type == "text" else '["..."]') + f"  /* {f.hint} */" for f in profile.fields
    )
    return SCHEMA_HINT.replace("{FIELDS}", "{" + fields + "}" if fields else "{}")


CONDENSE_SYSTEM = """TASK: condense-notes
You condense one window of a longer meeting transcript into dense notes for a later summary.
Keep every update, decision, commitment, blocker, number, name and system name, each with its
[m:ss] timestamp and speaker. Drop small talk. Output plain text lines: [m:ss] Speaker: note"""


def parse_json_object(text: str) -> dict:
    """Pull the first JSON object out of an LLM reply (handles code fences and leading prose)."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    start = cleaned.find("{")
    if start == -1:
        raise ValueError("no JSON object in reply")
    depth, in_str, esc = 0, False, False
    for i in range(start, len(cleaned)):
        ch = cleaned[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(cleaned[start : i + 1])
    raise ValueError("unterminated JSON object in reply")


def _windows(transcript: str, max_chars: int) -> list[str]:
    windows, current, size = [], [], 0
    for line in transcript.splitlines():
        if current and size + len(line) + 1 > max_chars:
            windows.append("\n".join(current))
            current, size = [], 0
        current.append(line)
        size += len(line) + 1
    if current:
        windows.append("\n".join(current))
    return windows


def _header(profile: Profile, title: str, started_at: datetime | None, speakers: list[str]) -> str:
    when = started_at.strftime("%Y-%m-%d %H:%M") if started_at else "unknown"
    out = (
        f"Meeting: {title}\nWhen: {when}\nSpeakers: {', '.join(speakers) or 'unknown'}\n"
        f"Instructions: {profile.instructions}\n"
    )
    if profile.fields:
        out += (
            'Profile fields to fill in "fields":\n'
            + "\n".join(f"- {f.key} ({f.label}): {f.hint}" for f in profile.fields)
            + "\n"
        )
    return out


def summarize_transcript(
    llm: LLM,
    transcript: str,
    profile: Profile,
    *,
    title: str,
    started_at: datetime | None,
    speakers: list[str],
    max_chars: int,
) -> MeetingSummary:
    if not transcript.strip():
        return MeetingSummary(overview="No speech was detected in this recording.")

    body = transcript
    if len(transcript) > max_chars:
        windows = _windows(transcript, max_chars)
        log.info("transcript is %d chars; condensing %d windows first", len(transcript), len(windows))
        notes = []
        for i, window in enumerate(windows, 1):
            notes.append(
                llm.complete(
                    CONDENSE_SYSTEM,
                    [{"role": "user", "content": f"Window {i} of {len(windows)}:\n{window}"}],
                    max_tokens=3000,
                )
            )
        body = "\n".join(notes)

    prompt = _header(profile, title, started_at, speakers) + "\nTranscript:\n" + body
    messages = [{"role": "user", "content": prompt}]
    last_error: Exception | None = None
    for attempt in range(2):
        reply = llm.complete(SUMMARY_SYSTEM + schema_for(profile), messages, max_tokens=4000, json_mode=True)
        try:
            summary = MeetingSummary.model_validate(parse_json_object(reply))
            if not profile.per_person:
                summary.people = []
            wanted = {f.key: f for f in profile.fields}
            summary.fields = {
                k: (v if wanted[k].type == "text" else [str(x) for x in v] if isinstance(v, list) else [str(v)])
                for k, v in summary.fields.items()
                if k in wanted and v
            }
            return summary
        except (ValueError, ValidationError) as e:
            last_error = e
            log.warning("summary JSON invalid (attempt %d): %s", attempt + 1, e)
            messages = [
                *messages,
                {"role": "assistant", "content": reply},
                {
                    "role": "user",
                    "content": "That was not valid JSON for the required shape. Return only the JSON object.",
                },
            ]
    raise ProviderError(f"the LLM did not return a valid summary: {last_error}")
