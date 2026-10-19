"""When should an answer card appear?

  name        your name or an alias appears in what someone else just said (fires on the partial
              transcript too, so retrieval can start before the question ends)
  question    a question in the last ~20 s, and the turn passes to you: you were just named, or you
              spoke last and the question says "you"
  keyword     a watched keyword (a system, project or client name) comes up
  explain     "what is X?" / "what does X mean?" about a glossary term or known entity
  commitment  something said matches an open commitment ("you promised X last time")

Each trigger has a cooldown so one exchange raises one card.
"""

import re
from collections import deque
from dataclasses import dataclass, field

from ..pipeline.memory import similarity

_QUESTION_START = re.compile(
    r"^(?:\w+,\s*)?(who|what|when|where|why|how|which|whose|can|could|would|will|do|does|did|is|are|was|were|"
    r"should|have|has|any|anything|status on|update on)\b",
    re.I,
)
_EXPLAIN = re.compile(
    r"\bwhat(?:'s| is| are| does| do)\s+(?:an?\s+|the\s+|our\s+)?"
    r"([\w][\w\-./ ]{1,40}?)(?:\s+(?:mean|stand for|do))?\s*\?",
    re.I,
)
_YOU = re.compile(r"\b(you|your|you'?re|you'?ve|yours)\b", re.I)


def is_question(text: str) -> bool:
    t = text.strip()
    return t.endswith("?") or bool(_QUESTION_START.match(t))


def mentions(text: str, name: str) -> bool:
    return bool(name) and re.search(rf"(?<![\w]){re.escape(name)}(?![\w])", text, re.I) is not None


@dataclass
class Trigger:
    kind: str  # name | question | keyword | explain | commitment
    text: str  # the line that fired it
    question: str  # what the card should answer
    speaker: str
    at: float
    term: str | None = None
    commitment: dict | None = None
    prefetch: bool = False  # from a partial: start retrieval, don't show a card yet


@dataclass
class _Said:
    at: float
    speaker: str
    text: str
    is_owner: bool


@dataclass
class TriggerDetector:
    owner_names: list[str]
    keywords: list[str] = field(default_factory=list)
    terms: dict[str, str | None] = field(default_factory=dict)  # explainable term (lowercase) -> definition
    commitments: list[dict] = field(default_factory=list)  # open: {"id", "owner", "text", "due", "mine"}
    window_s: float = 20.0
    cooldown_s: float = 30.0
    keyword_cooldown_s: float = 300.0

    def __post_init__(self):
        self.recent: deque[_Said] = deque()
        self.fired: dict[str, float] = {}
        self.owner_names = [n for n in self.owner_names if n and len(n) > 1]

    def _cool(self, key: str, at: float, cooldown: float) -> bool:
        last = self.fired.get(key)
        if last is not None and at - last < cooldown:
            return False
        self.fired[key] = at
        return True

    def _named(self, text: str) -> bool:
        return any(mentions(text, n) for n in self.owner_names)

    def partial(self, speaker: str, is_owner: bool, text: str, at: float) -> Trigger | None:
        if not is_owner and self._named(text) and self._cool(f"prefetch:{speaker}", at, 8.0):
            return Trigger("name", text, text, speaker, at, prefetch=True)
        return None

    def final(self, speaker: str, is_owner: bool, text: str, at: float) -> list[Trigger]:
        text = text.strip()
        if not text:
            return []
        prev = self.recent[-1] if self.recent else None
        self.recent.append(_Said(at, speaker, text, is_owner))
        while self.recent and at - self.recent[0].at > self.window_s:
            self.recent.popleft()
        out: list[Trigger] = []

        for c in self.commitments:  # "you promised X last time", once per commitment
            if similarity(c["text"], text) >= 0.5 and self._cool(f"commitment:{c['id']}", at, 1e9):
                out.append(Trigger("commitment", text, c["text"], speaker, at, commitment=c))

        if is_owner:
            return out  # your own speech never raises an answer card

        m = _EXPLAIN.search(text)
        if m:
            term = m.group(1).strip().rstrip("?").lower()
            known = next((t for t in self.terms if t == term or term.endswith(t)), None)
            if known and self._cool(f"explain:{known}", at, 1e9):
                out.append(Trigger("explain", text, text, speaker, at, term=known))
                return out

        named = self._named(text)
        recently_named = any(self._named(s.text) and not s.is_owner for s in list(self.recent)[:-1])
        if is_question(text) and (
            named or recently_named or (prev is not None and prev.is_owner and _YOU.search(text))
        ):
            if self._cool("answer", at, self.cooldown_s):
                out.append(Trigger("name" if named else "question", text, text, speaker, at))
                return out
        elif named and self._cool(f"prefetch:{speaker}", at, 8.0):
            # Named but not asked yet: start retrieval now; the card fires when the question comes.
            out.append(Trigger("name", text, text, speaker, at, prefetch=True))
            return out

        for kw in self.keywords:
            if mentions(text, kw) and self._cool(f"keyword:{kw.lower()}", at, self.keyword_cooldown_s):
                out.append(Trigger("keyword", text, f"What's the latest on {kw}?", speaker, at, term=kw))
                break
        return out
