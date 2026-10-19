from dataclasses import dataclass, field


@dataclass
class Word:
    start: float
    end: float
    text: str


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str
    speaker: str | None = None  # set when the STT provider diarizes itself (Deepgram)
    words: list[Word] = field(default_factory=list)  # optional word timings, used to split at speaker changes


@dataclass
class SpeakerTurn:
    start: float
    end: float
    speaker: str


class ProviderError(RuntimeError):
    """A model provider failed in a way the user can act on (bad key, server down, wrong model)."""
