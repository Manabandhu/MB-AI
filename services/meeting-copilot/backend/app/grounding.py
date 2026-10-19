"""Never state something the history can't back: check an answer's specifics against its sources.

Numbers, dates, weekdays, months and capitalised names in the answer must appear in the sources (or the
question). Anything else is a sign the model filled a gap, and the answer is flagged as not grounded.
"""

import re

_NUMBER = re.compile(r"(?<![\w.])\d+(?:[.,:]\d+)*%?")
_WEEKDAY = re.compile(r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", re.I)
_MONTH = re.compile(
    r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\b", re.I
)
_NAME = re.compile(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b")
_CITE = re.compile(r"\[S\d+\]")
_IGNORE_NAMES = {
    "I", "The", "This", "That", "Yes", "No", "Not", "From", "Your", "You", "They", "We", "It", "He", "She", "In",
    "On", "At", "For", "And", "But", "Or", "So", "Today", "Yesterday", "Tomorrow", "Sources", "Source", "Meeting",
    "Summary", "Action", "Decision", "Commitment", "Based", "According", "There", "Here", "Sure", "Also", "However",
    "Unfortunately", "Nothing", "Nobody", "None", "Last", "Next", "Everyone", "Someone", "If", "When", "Their",
    "Our", "My", "His", "Her", "Its", "These", "Those", "What", "Who", "Why", "How", "After", "Before", "Both",
    "Not", "Open", "Done", "Note", "Yes", "Okay", "Ok", "Then", "Still",
}  # fmt: skip
_CALENDAR = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "january", "february",
             "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"}  # fmt: skip


def specifics(text: str) -> set[str]:
    text = _CITE.sub(" ", text)
    out = {m.group(0).rstrip("%").replace(",", "") for m in _NUMBER.finditer(text)}
    out |= {m.group(1).lower() for m in _WEEKDAY.finditer(text)}
    out |= {m.group(1).lower() for m in _MONTH.finditer(text)}
    for m in _NAME.finditer(text):
        words = [w for w in m.group(1).split() if w not in _IGNORE_NAMES and w.lower() not in _CALENDAR]
        if words:
            out.add(" ".join(words))
    return out


def ungrounded(answer: str, sources: list[str], question: str = "") -> list[str]:
    """Specifics in the answer that appear in none of the sources nor the question."""
    haystack = " ".join([*sources, question])
    hay_lower = haystack.lower().replace(",", "")
    missing = []
    for s in specifics(answer):
        if s[0].isdigit():
            if not re.search(rf"(?<![\d]){re.escape(s)}(?![\d])", hay_lower):
                missing.append(s)
        elif s.lower() not in hay_lower:
            missing.append(s)
    return sorted(missing)
