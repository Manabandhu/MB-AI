"""Pure functions that turn raw STT + diarization output into a clean, speaker-labelled transcript."""

import re
from dataclasses import dataclass

from ..providers.types import SpeakerTurn, TranscriptSegment, Word

OWNER_LABEL = "me"


@dataclass
class Line:
    start: float
    end: float
    speaker: str  # final label: "me", "S1", "S2", ...
    text: str


def _overlap(a0: float, a1: float, b0: float, b1: float) -> float:
    return max(0.0, min(a1, b1) - max(a0, b0))


def _speaker_at(start: float, end: float, turns: list[SpeakerTurn], max_gap: float = 1.0) -> str | None:
    """Speaker with the most overlap; if none overlaps, the nearest turn within max_gap seconds."""
    best, best_overlap = None, 0.0
    for t in turns:
        ov = _overlap(start, end, t.start, t.end)
        if ov > best_overlap:
            best, best_overlap = t.speaker, ov
    if best is not None:
        return best
    mid = (start + end) / 2
    nearest, dist = None, max_gap
    for t in turns:
        d = min(abs(mid - t.start), abs(mid - t.end))
        if d <= dist:
            nearest, dist = t.speaker, d
    return nearest


def _join_words(words: list[Word]) -> str:
    return re.sub(r"\s+", " ", "".join(w.text for w in words)).strip()


def assign_speakers(segments: list[TranscriptSegment], turns: list[SpeakerTurn], fallback: str) -> list[Line]:
    """Give every transcript segment a raw speaker label.

    With word timings, words are labelled one by one and regrouped, so a segment that spans a
    speaker change is split at the change. Without them the whole segment takes the majority speaker.
    """
    lines: list[Line] = []
    for seg in segments:
        if seg.speaker is not None:  # provider already diarized (Deepgram)
            lines.append(Line(seg.start, seg.end, seg.speaker, seg.text))
            continue
        if not turns:
            lines.append(Line(seg.start, seg.end, fallback, seg.text))
            continue
        if not seg.words:
            lines.append(Line(seg.start, seg.end, _speaker_at(seg.start, seg.end, turns) or fallback, seg.text))
            continue
        group: list[Word] = []
        group_speaker: str | None = None
        for w in seg.words:
            spk = _speaker_at(w.start, w.end, turns) or group_speaker or fallback
            if group and spk != group_speaker:
                lines.append(Line(group[0].start, group[-1].end, group_speaker or fallback, _join_words(group)))
                group = []
            group.append(w)
            group_speaker = spk
        if group:
            lines.append(Line(group[0].start, group[-1].end, group_speaker or fallback, _join_words(group)))
    return [ln for ln in lines if ln.text]


def relabel(lines: list[Line], keep: frozenset[str] = frozenset({OWNER_LABEL})) -> list[Line]:
    """Map raw labels (SPEAKER_00, dg1, F4...) to S1, S2... in order of first appearance."""
    mapping: dict[str, str] = {}
    out = []
    for ln in sorted(lines, key=lambda x: x.start):
        if ln.speaker in keep:
            out.append(ln)
            continue
        if ln.speaker not in mapping:
            mapping[ln.speaker] = f"S{len(mapping) + 1}"
        out.append(Line(ln.start, ln.end, mapping[ln.speaker], ln.text))
    return out


_TOKEN = re.compile(r"[a-z0-9']+")


def _tokens(text: str) -> set[str]:
    return set(_TOKEN.findall(text.lower()))


def drop_echo(mine: list[Line], others: list[Line], pad: float = 1.5, threshold: float = 0.6) -> list[Line]:
    """Remove lines from your mic that are just the other side leaking through your speakers.

    A mic line is echo when, within `pad` seconds of it, the system channel said mostly the same words.
    """
    kept = []
    for ln in mine:
        near = [o for o in others if _overlap(ln.start - pad, ln.end + pad, o.start, o.end) > 0]
        if near:
            mine_tok = _tokens(ln.text)
            other_tok = set().union(*(_tokens(o.text) for o in near))
            if mine_tok and len(mine_tok & other_tok) / len(mine_tok) >= threshold:
                continue
        kept.append(ln)
    return kept


def merge_adjacent(lines: list[Line], max_gap: float = 1.0, max_len: float = 60.0) -> list[Line]:
    """Join consecutive lines from the same speaker into one turn."""
    out: list[Line] = []
    for ln in sorted(lines, key=lambda x: x.start):
        prev = out[-1] if out else None
        if (
            prev is not None
            and prev.speaker == ln.speaker
            and ln.start - prev.end <= max_gap
            and ln.end - prev.start <= max_len
        ):
            out[-1] = Line(prev.start, max(prev.end, ln.end), prev.speaker, f"{prev.text} {ln.text}")
        else:
            out.append(ln)
    return out


def fmt_ts(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 60}:{s % 60:02d}"


def format_transcript(lines: list[Line], names: dict[str, str]) -> str:
    return "\n".join(f"[{fmt_ts(ln.start)}] {names.get(ln.speaker, ln.speaker)}: {ln.text}" for ln in lines)
