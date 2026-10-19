"""Audio capture sources.

WindowsCapture records your default microphone and, through WASAPI loopback, whatever your
default speakers or headset are playing (the Teams call). FakeCapture generates test tones so
the whole app can be exercised on any OS.
"""

from __future__ import annotations

import sys
import threading
import time
from collections.abc import Callable
from pathlib import Path

import numpy as np

from .audio import SAMPLE_RATE, ChannelWriter

CHUNK_FRAMES = SAMPLE_RATE // 10  # 100 ms


class CaptureError(RuntimeError):
    pass


def _init_com_for_thread() -> None:
    """soundcard initializes COM only on the importing thread; capture threads need it too."""
    if sys.platform != "win32":
        return
    import ctypes

    ctypes.windll.ole32.CoInitializeEx(None, 0)  # COINIT_MULTITHREADED; "already initialized" is fine


class _Source(threading.Thread):
    def __init__(self, name: str, open_recorder: Callable, writer: ChannelWriter, stop: threading.Event):
        super().__init__(name=name, daemon=True)
        self.open_recorder = open_recorder
        self.writer = writer
        self.stop_event = stop
        self.error: Exception | None = None

    def run(self) -> None:
        try:
            _init_com_for_thread()
            with self.open_recorder() as rec:
                while not self.stop_event.is_set():
                    data = rec.record(numframes=CHUNK_FRAMES)
                    self.writer.write(data, time.monotonic())
        except Exception as e:  # surfaced to the UI by Capture.check()
            self.error = e


class Capture:
    """Records one or two sources into per-channel WAV files until stop() is called."""

    def __init__(self, workdir: Path, with_meeting_audio: bool):
        self.workdir = workdir
        self.with_meeting_audio = with_meeting_audio
        self.mic_path = workdir / "mic.raw"
        self.meeting_path = workdir / "meeting.raw" if with_meeting_audio else None
        self._stop = threading.Event()
        self._threads: list[_Source] = []
        self.mic: ChannelWriter | None = None
        self.meeting: ChannelWriter | None = None
        self.device_names: dict[str, str] = {}

    # Subclasses return context-manager factories for each source.
    def _mic_factory(self) -> Callable:
        raise NotImplementedError

    def _meeting_factory(self) -> Callable:
        raise NotImplementedError

    def start(self) -> None:
        t0 = time.monotonic()
        self.mic = ChannelWriter(self.mic_path, t0)
        self._threads.append(_Source("mic", self._mic_factory(), self.mic, self._stop))
        if self.meeting_path is not None:
            self.meeting = ChannelWriter(self.meeting_path, t0)
            self._threads.append(_Source("meeting", self._meeting_factory(), self.meeting, self._stop))
        for t in self._threads:
            t.start()

    def check(self) -> None:
        """Raise if a capture thread died (device unplugged, access denied)."""
        for t in self._threads:
            if t.error is not None:
                raise CaptureError(f"{t.name} capture stopped: {t.error}")

    def levels(self) -> tuple[float, float]:
        return (self.mic.level if self.mic else 0.0, self.meeting.level if self.meeting else 0.0)

    @property
    def seconds(self) -> float:
        return self.mic.seconds if self.mic else 0.0

    def stop(self) -> None:
        self._stop.set()
        for t in self._threads:
            t.join(timeout=5)
        for w in (self.mic, self.meeting):
            if w is not None:
                w.close()


class WindowsCapture(Capture):
    def __init__(self, workdir: Path, with_meeting_audio: bool):
        super().__init__(workdir, with_meeting_audio)
        try:
            import soundcard as sc
        except Exception as e:  # pragma: no cover - Windows only
            raise CaptureError(f"audio library failed to load: {e}") from e
        self.sc = sc
        mic = sc.default_microphone()
        if mic is None:
            raise CaptureError(
                "No microphone found. Plug one in or set a default input device in Windows Sound settings."
            )
        self._mic_device = mic
        self.device_names["mic"] = mic.name
        if with_meeting_audio:
            speaker = sc.default_speaker()
            if speaker is None:
                raise CaptureError("No playback device found to capture meeting audio from.")
            # The loopback "microphone" of the default speaker hears whatever the call plays.
            self._loop_device = sc.get_microphone(id=str(speaker.name), include_loopback=True)
            self.device_names["meeting"] = speaker.name

    def _mic_factory(self):
        return lambda: self._mic_device.recorder(samplerate=SAMPLE_RATE)

    def _meeting_factory(self):
        return lambda: self._loop_device.recorder(samplerate=SAMPLE_RATE)


class _ToneRecorder:
    """Stands in for a soundcard recorder: real-time tones with gaps, like turns in a conversation."""

    def __init__(self, freq: float, on_s: float, off_s: float, offset_s: float):
        self.freq, self.on_s, self.off_s, self.offset_s = freq, on_s, off_s, offset_s
        self.pos = 0

    def __enter__(self):
        self.started = time.monotonic()
        return self

    def __exit__(self, *exc):
        return False

    def record(self, numframes: int) -> np.ndarray:
        # pace like a real device
        due = self.started + (self.pos + numframes) / SAMPLE_RATE
        delay = due - time.monotonic()
        if delay > 0:
            time.sleep(delay)
        t = (self.pos + np.arange(numframes)) / SAMPLE_RATE
        period = self.on_s + self.off_s
        active = ((t - self.offset_s) % period) < self.on_s
        active &= t >= self.offset_s
        self.pos += numframes
        return (0.3 * np.sin(2 * np.pi * self.freq * t) * active).astype(np.float32)[:, None]


class FakeCapture(Capture):
    """`python -m meeting_recorder --fake-audio`: no devices needed."""

    def __init__(self, workdir: Path, with_meeting_audio: bool):
        super().__init__(workdir, with_meeting_audio)
        self.device_names = {"mic": "test tone 300 Hz", "meeting": "test tone 600 Hz"}

    def _mic_factory(self):
        return lambda: _ToneRecorder(300, on_s=2.0, off_s=4.0, offset_s=0.5)

    def _meeting_factory(self):
        return lambda: _ToneRecorder(600, on_s=2.5, off_s=3.5, offset_s=3.0)
