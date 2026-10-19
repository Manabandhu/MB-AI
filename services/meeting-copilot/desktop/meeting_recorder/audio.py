"""Platform-independent audio plumbing for the recorder (tested on Linux, used on Windows).

Each source (your mic, the meeting's system audio) is captured on its own thread into its own
headerless 16-bit 16 kHz file. Raw PCM has no header to finalize, so a crash or power loss
leaves a readable file. When the recording stops, the two are merged into one stereo FLAC:
left = you, right = the meeting. The server uses that split to tell you apart from everyone else.
"""

from __future__ import annotations

import math
import threading
from pathlib import Path

import numpy as np
import soundfile as sf

SAMPLE_RATE = 16_000
BLOCK = SAMPLE_RATE * 10


class GapFiller:
    """Keeps a channel aligned with the wall clock.

    Both channels share one start time. If a device delivers nothing for a while (a stall, a
    sleeping driver), the missing span is filled with silence so the two channels stay in sync.
    """

    def __init__(self, t0: float, samplerate: int = SAMPLE_RATE, tolerance_s: float = 0.3):
        self.t0 = t0
        self.sr = samplerate
        self.tolerance = int(tolerance_s * samplerate)
        self.written = 0

    def silence_before(self, n_frames: int, now: float) -> int:
        """Frames of silence to insert before a chunk of n_frames that just arrived at `now`."""
        expected = int((now - self.t0) * self.sr)
        missing = expected - (self.written + n_frames)
        return missing if missing > self.tolerance else 0

    def advance(self, n_frames: int) -> None:
        self.written += n_frames


class ChannelWriter:
    """Thread-safe mono writer with a live level meter."""

    def __init__(self, path: Path, t0: float, samplerate: int = SAMPLE_RATE):
        self.path = path
        self.sr = samplerate
        self.file = sf.SoundFile(str(path), "w", samplerate=samplerate, channels=1, subtype="PCM_16", format="RAW")
        self.filler = GapFiller(t0, samplerate)
        self._level = 0.0
        self._lock = threading.Lock()

    def write(self, chunk: np.ndarray, now: float) -> None:
        mono = chunk.mean(axis=1) if chunk.ndim == 2 else chunk
        mono = np.asarray(mono, dtype=np.float32)
        gap = self.filler.silence_before(len(mono), now)
        with self._lock:
            if gap:
                self.file.write(np.zeros(gap, dtype=np.float32))
                self.filler.advance(gap)
            self.file.write(np.clip(mono, -1.0, 1.0))
            self.filler.advance(len(mono))
            rms = float(np.sqrt(np.mean(np.square(mono)))) if len(mono) else 0.0
            # -60..0 dBFS mapped to 0..1, with a little smoothing for the meter
            level = min(1.0, max(0.0, (20 * math.log10(rms or 1e-6) + 60) / 60))
            self._level = 0.6 * self._level + 0.4 * level

    @property
    def level(self) -> float:
        return self._level

    @property
    def seconds(self) -> float:
        return self.filler.written / self.sr

    def close(self) -> None:
        with self._lock:
            self.file.close()


def _open_raw(path: Path) -> sf.SoundFile:
    return sf.SoundFile(str(path), samplerate=SAMPLE_RATE, channels=1, subtype="PCM_16", format="RAW")


def raw_frames(path: Path) -> int:
    return path.stat().st_size // 2


def mixdown(left: Path, right: Path | None, out: Path) -> float:
    """Merge two mono raw PCM captures into one FLAC (left=you, right=meeting). Returns seconds.

    The shorter channel is padded with silence. With no right channel (in-person mode) the
    output is a mono FLAC.
    """
    lframes = raw_frames(left)
    rframes = raw_frames(right) if right is not None else 0
    total = max(lframes, rframes)
    channels = 1 if right is None else 2
    part = out.with_name(out.name + ".part")  # renamed only once complete
    with sf.SoundFile(str(part), "w", samplerate=SAMPLE_RATE, channels=channels, format="FLAC") as dst:
        lf = _open_raw(left)
        rf = _open_raw(right) if right is not None else None
        try:
            done = 0
            while done < total:
                n = min(BLOCK, total - done)
                block = np.zeros((n, channels), dtype=np.float32)
                lblock = lf.read(n, dtype="float32")
                block[: len(lblock), 0] = lblock
                if rf is not None:
                    rblock = rf.read(n, dtype="float32")
                    block[: len(rblock), 1] = rblock
                dst.write(block if channels == 2 else block[:, 0])
                done += n
        finally:
            lf.close()
            if rf is not None:
                rf.close()
    part.replace(out)
    return total / SAMPLE_RATE
