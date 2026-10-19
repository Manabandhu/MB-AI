"""Speaker labels that come from the meeting platform instead of our own diarization.

Sources:
  - a meeting bot's per-participant transcript (Attendee, Vexa, Recall)
  - a Teams or Zoom transcript file (WebVTT with <v Speaker Name> voice tags)

They are stored on the meeting as turns ({start, end, speaker}) and used in place of diarization:
each transcript segment takes the participant whose turn overlaps it most.
"""

import re

from ..providers.types import SpeakerTurn

_TS = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})")
_CUE = re.compile(rf"^\s*({_TS.pattern})\s*-->\s*({_TS.pattern})")
_VOICE = re.compile(r"<v(?:\.[^ >]+)?\s+([^>]+)>(.*?)(?:</v>|$)", re.S)


def _seconds(m: re.Match, offset: int = 0) -> float:
    h, mm, ss, frac = m.group(1 + offset), m.group(2 + offset), m.group(3 + offset), m.group(4 + offset)
    return int(h or 0) * 3600 + int(mm) * 60 + int(ss) + int(frac.ljust(3, "0")) / 1000


def parse_vtt(text: str) -> list[dict]:
    """Teams: `<v Priya Rao>text</v>`. Zoom: `Priya Rao: text`. Lines without a speaker are skipped."""
    turns: list[dict] = []
    blocks = re.split(r"\n\s*\n", text.replace("\r\n", "\n"))
    for block in blocks:
        lines = [ln for ln in block.strip().split("\n") if ln.strip()]
        for i, line in enumerate(lines):
            cue = _CUE.match(line)
            if not cue:
                continue
            start = _seconds(_TS.match(cue.group(1)))
            end = _seconds(_TS.match(cue.group(6)))
            body = " ".join(lines[i + 1 :]).strip()
            speaker, words = None, body
            v = _VOICE.search(body)
            if v:
                speaker, words = v.group(1).strip(), re.sub(r"<[^>]+>", "", v.group(2)).strip()
            else:
                m = re.match(r"^([^:]{1,60}):\s+(.+)$", body)
                if m:
                    speaker, words = m.group(1).strip(), m.group(2).strip()
            if speaker and end > start:
                turns.append({"start": round(start, 3), "end": round(end, 3), "speaker": speaker, "text": words})
            break
    return merge_turns(turns)


def merge_turns(turns: list[dict], max_gap: float = 0.5) -> list[dict]:
    out: list[dict] = []
    for t in sorted(turns, key=lambda x: x["start"]):
        if out and out[-1]["speaker"] == t["speaker"] and t["start"] - out[-1]["end"] <= max_gap:
            out[-1]["end"] = max(out[-1]["end"], t["end"])
            out[-1]["text"] = (out[-1].get("text", "") + " " + t.get("text", "")).strip()
        else:
            out.append(dict(t))
    return out


def to_speaker_turns(turns: list[dict]) -> list[SpeakerTurn]:
    return [SpeakerTurn(float(t["start"]), float(t["end"]), str(t["speaker"])) for t in turns if t.get("speaker")]
