"""Model-free providers for tests and demo mode.

Set STT_PROVIDER=fake DIARIZER=fake LLM_PROVIDER=fake EMBED_PROVIDER=fake to run the whole
app with no GPU, no API keys and no model downloads. The outputs are placeholders, but every
code path (audio handling, storage, database, UI) is real.
"""

import hashlib
import json
import math
import re
from pathlib import Path

import numpy as np
import soundfile as sf

from .types import SpeakerTurn, TranscriptSegment

DEMO_LINES = [
    "Yesterday I finished the VPN tunnel config and opened the change request.",
    "Today I'm picking up the document service load test.",
    "I'm blocked on firewall approval from the network team.",
    "Yesterday I reviewed the Terraform module for the new subnets.",
    "Today I'll pair on the API gateway deployment pipeline.",
    "No blockers from my side.",
    "Can you send me the runbook link after this?",
    "Let's decide to move the cutover to Thursday.",
]


def speech_regions(path: Path, frame_s: float = 0.05, min_len_s: float = 0.3, gap_s: float = 0.4):
    """Very small energy-based voice activity detector. Returns [(start, end, mean_freq_hz)]."""
    audio, sr = sf.read(str(path), dtype="float32", always_2d=True)
    mono = audio.mean(axis=1)
    hop = max(1, int(sr * frame_s))
    n = len(mono) // hop
    if n == 0:
        return []
    frames = mono[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames**2).mean(axis=1))
    threshold = max(0.01, 0.1 * float(rms.max()))
    active = rms > threshold
    regions, start = [], None
    for i, on in enumerate(active):
        if on and start is None:
            start = i
        elif not on and start is not None:
            regions.append([start, i])
            start = None
    if start is not None:
        regions.append([start, n])
    merged: list[list[int]] = []
    for r in regions:
        if merged and (r[0] - merged[-1][1]) * frame_s < gap_s:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    out = []
    for a, b in merged:
        if (b - a) * frame_s < min_len_s:
            continue
        chunk = mono[a * hop : b * hop]
        crossings = np.count_nonzero(np.diff(np.signbit(chunk)))
        freq = crossings * sr / (2 * max(1, len(chunk)))
        out.append((a * frame_s, b * frame_s, freq))
    return out


class FakeTranscriber:
    name = "fake-stt"
    returns_speakers = False

    def transcribe(self, wav_path: Path, diarize: bool = False) -> list[TranscriptSegment]:
        segs = []
        for i, (start, end, freq) in enumerate(speech_regions(wav_path)):
            # Different "voices" (pitches) start at different demo lines, so echo detection and
            # search have distinct text to work with.
            line = DEMO_LINES[(int(round(freq / 100.0)) + i) % len(DEMO_LINES)]
            segs.append(TranscriptSegment(start=round(start, 2), end=round(end, 2), text=line))
        return segs


class FakeDiarizer:
    """Labels each speech region by its pitch, so different synthetic voices become different speakers."""

    name = "fake-diarizer"

    def diarize(self, wav_path: Path) -> list[SpeakerTurn]:
        return [
            SpeakerTurn(start=round(s, 2), end=round(e, 2), speaker=f"F{int(round(f / 100.0))}")
            for s, e, f in speech_regions(wav_path)
        ]


_LINE = re.compile(r"^\[(\d+):(\d\d)\]\s*([^:]+):\s*(.*)$")


class FakeLLM:
    name = "fake-llm"

    def __init__(self):
        self.calls: list[tuple[str, list[dict]]] = []

    def complete(self, system, messages, *, max_tokens=4000, temperature=0.2, json_mode=False) -> str:
        self.calls.append((system, messages))
        user = messages[-1]["content"]
        if "TASK: condense-notes" in system:
            return "\n".join(user.splitlines()[:40])
        if "TASK: summarize-meeting" in system:
            return json.dumps(self._summary(user))
        if "TASK: answer-from-history" in system:
            m = re.search(r"\[S(\d+)\][^\n]*\n(.+)", user)
            if not m:
                return "I couldn't find that in your meetings."
            return f"From your meetings: {m.group(2).strip()[:200]} [S{m.group(1)}]"
        return "ok"

    @staticmethod
    def _summary(transcript: str) -> dict:
        people: dict[str, list[str]] = {}
        actions = []
        for line in transcript.splitlines():
            m = _LINE.match(line.strip())
            if not m:
                continue
            at = int(m.group(1)) * 60 + int(m.group(2))
            name, text = m.group(3).strip(), m.group(4).strip()
            people.setdefault(name, []).append(text)
            if "send" in text.lower() or "i'll" in text.lower():
                actions.append({"owner": name, "text": text, "due": None, "at": at})
        return {
            "overview": f"Demo summary of a meeting with {len(people)} speaker(s).",
            "people": [
                {"name": n, "yesterday": [], "today": lines[:2], "blockers": [t for t in lines if "block" in t.lower()]}
                for n, lines in people.items()
            ],
            "key_points": [{"text": lines[0], "at": None} for lines in people.values()][:5],
            "decisions": [],
            "action_items": actions,
            "open_questions": [],
        }


class FakeEmbedder:
    """Hashed bag-of-words: texts sharing words get similar vectors. Deterministic across runs."""

    name = "fake-embedder"

    def __init__(self, dim: int):
        self.dim = dim

    def embed(self, texts: list[str], kind) -> list[list[float]]:
        out = []
        for text in texts:
            v = [0.0] * self.dim
            for tok in re.findall(r"[a-z0-9]+", text.lower()):
                h = int.from_bytes(hashlib.md5(tok.encode()).digest()[:8], "big")
                v[h % self.dim] += 1.0 if (h >> 63) & 1 else -1.0
            norm = math.sqrt(sum(x * x for x in v)) or 1.0
            out.append([x / norm for x in v])
        return out
