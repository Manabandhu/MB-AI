"""Streaming speech to text for the live path. Trades accuracy for speed; the post-meeting path
re-transcribes everything with the batch model before anything is written to memory.

  sherpa_onnx     NVIDIA NeMo streaming FastConformer / Parakeet-style transducers exported for
                  sherpa-onnx (SHERPA_MODEL_DIR with tokens.txt, encoder/decoder/joiner .onnx)
  faster_whisper  a small Whisper model re-run over the current utterance every ~1 s (LIVE_WHISPER_MODEL)
  deepgram        Deepgram streaming (paid), interim + final results over a WebSocket
  fake            energy-based stand-in for tests and demo mode

Each stream takes 16 kHz mono float32 audio for ONE channel and returns partial and final results
with times relative to the start of the stream.
"""

import json
import logging
import queue
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np

from ..config import Settings
from .types import ProviderError

log = logging.getLogger(__name__)

SR = 16_000


@dataclass
class LiveText:
    kind: str  # partial | final
    start: float
    end: float
    text: str


class LiveStream(Protocol):
    def accept(self, audio: np.ndarray) -> list[LiveText]: ...
    def flush(self) -> list[LiveText]: ...
    def close(self) -> None: ...


class StreamingTranscriber(Protocol):
    name: str

    def open(self, vocabulary: list[str] | None = None) -> LiveStream: ...


class _Vad:
    """Tiny energy VAD: tracks whether we are inside an utterance and when it ended."""

    def __init__(self, frame_s: float = 0.03, threshold: float = 0.01, end_silence_s: float = 0.5):
        self.frame = int(SR * frame_s)
        self.threshold = threshold
        self.end_silence = end_silence_s
        self.pos = 0  # samples seen
        self.in_speech = False
        self.speech_start = 0.0
        self.last_voice = 0.0
        self._carry = np.zeros(0, dtype=np.float32)

    def feed(self, audio: np.ndarray) -> list[tuple[str, float]]:
        """Returns events [("start", t) | ("end", t)]."""
        events = []
        data = np.concatenate([self._carry, audio])
        n = len(data) // self.frame
        for i in range(n):
            chunk = data[i * self.frame : (i + 1) * self.frame]
            t = (self.pos + (i + 1) * self.frame) / SR
            loud = float(np.sqrt(np.mean(chunk**2))) > self.threshold
            if loud:
                if not self.in_speech:
                    self.in_speech, self.speech_start = True, t - self.frame / SR
                    events.append(("start", self.speech_start))
                self.last_voice = t
            elif self.in_speech and t - self.last_voice >= self.end_silence:
                self.in_speech = False
                events.append(("end", self.last_voice))
        self.pos += n * self.frame
        self._carry = data[n * self.frame :]
        return events


# ------------------------------------------------------------------------------------------- fake


class _FakeStream:
    def __init__(self):
        self.vad = _Vad(end_silence_s=0.35)
        self.buf: list[np.ndarray] = []
        self.count = 0

    def _line(self, audio: np.ndarray) -> str:
        from .fakes import DEMO_LINES

        crossings = np.count_nonzero(np.diff(np.signbit(audio))) if len(audio) else 0
        freq = crossings * SR / (2 * max(1, len(audio)))
        return DEMO_LINES[(int(round(freq / 100.0)) + self.count) % len(DEMO_LINES)]

    def accept(self, audio: np.ndarray) -> list[LiveText]:
        out = []
        for kind, t in self.vad.feed(audio):
            if kind == "start":
                self.buf = []
            elif kind == "end":
                seg = np.concatenate(self.buf) if self.buf else np.zeros(0, dtype=np.float32)
                if len(seg) >= SR * 0.3:
                    out.append(LiveText("final", round(self.vad.speech_start, 2), round(t, 2), self._line(seg)))
                    self.count += 1
                self.buf = []
        if self.vad.in_speech:
            self.buf.append(audio)
            seg = np.concatenate(self.buf)
            if len(seg) >= SR * 0.5:
                words = self._line(seg).split()
                out.append(
                    LiveText(
                        "partial",
                        round(self.vad.speech_start, 2),
                        round(self.vad.pos / SR, 2),
                        " ".join(words[: max(1, len(words) // 2)]),
                    )
                )
        return out

    def flush(self) -> list[LiveText]:
        if self.vad.in_speech and self.buf:
            seg = np.concatenate(self.buf)
            self.vad.in_speech = False
            return [LiveText("final", round(self.vad.speech_start, 2), round(self.vad.pos / SR, 2), self._line(seg))]
        return []

    def close(self) -> None:
        pass


class FakeStreamingTranscriber:
    name = "fake-live-stt"

    def open(self, vocabulary: list[str] | None = None) -> LiveStream:
        return _FakeStream()


class NoStreamingTranscriber:
    name = "none"

    def open(self, vocabulary: list[str] | None = None) -> LiveStream:
        raise ProviderError("live transcription is turned off (LIVE_STT_PROVIDER=none); send captions instead")


# --------------------------------------------------------------------------------- faster-whisper


class _WhisperStream:
    """Re-decodes the current utterance every LIVE_PARTIAL_EVERY_S; finalizes it at a pause."""

    def __init__(self, model, settings: Settings, vocabulary: list[str] | None):
        self.model = model
        self.settings = settings
        self.prompt = ("Glossary: " + ", ".join(vocabulary[:40]) + ".") if vocabulary else None
        self.vad = _Vad(end_silence_s=0.6)
        self.buf: list[np.ndarray] = []
        self.since_partial = 0.0

    def _decode(self, audio: np.ndarray) -> str:  # pragma: no cover - needs the model
        segments, _ = self.model.transcribe(
            audio,
            language=self.settings.whisper_language or None,
            beam_size=1,
            vad_filter=False,
            condition_on_previous_text=False,
            initial_prompt=self.prompt,
            without_timestamps=True,
        )
        return " ".join(s.text.strip() for s in segments).strip()

    def accept(self, audio: np.ndarray) -> list[LiveText]:  # pragma: no cover - needs the model
        out = []
        for kind, t in self.vad.feed(audio):
            if kind == "start":
                self.buf, self.since_partial = [], 0.0
            elif kind == "end" and self.buf:
                text = self._decode(np.concatenate(self.buf))
                if text:
                    out.append(LiveText("final", self.vad.speech_start, t, text))
                self.buf = []
        if self.vad.in_speech:
            self.buf.append(audio)
            self.since_partial += len(audio) / SR
            if self.since_partial >= self.settings.live_partial_every_s:
                self.since_partial = 0.0
                text = self._decode(np.concatenate(self.buf)[-SR * 15 :])
                if text:
                    out.append(LiveText("partial", self.vad.speech_start, self.vad.pos / SR, text))
        return out

    def flush(self) -> list[LiveText]:  # pragma: no cover - needs the model
        if self.buf:
            text = self._decode(np.concatenate(self.buf))
            self.buf = []
            if text:
                return [LiveText("final", self.vad.speech_start, self.vad.pos / SR, text)]
        return []

    def close(self) -> None:
        pass


class FasterWhisperStreaming:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.name = f"faster-whisper-live:{settings.live_whisper_model}"
        self._model = None
        self._lock = threading.Lock()

    def _load(self):  # pragma: no cover - needs the model
        with self._lock:
            if self._model is None:
                try:
                    from faster_whisper import WhisperModel
                except ImportError as e:
                    raise ProviderError(
                        "faster-whisper is not installed in this process. Run live STT in the worker image "
                        "(LIVE_UPSTREAM) or set LIVE_STT_PROVIDER=deepgram"
                    ) from e
                self._model = WhisperModel(
                    self.settings.live_whisper_model,
                    device=self.settings.whisper_device,
                    compute_type=self.settings.whisper_compute_type,
                )
        return self._model

    def open(self, vocabulary: list[str] | None = None) -> LiveStream:  # pragma: no cover - needs the model
        return _WhisperStream(self._load(), self.settings, vocabulary)


# ------------------------------------------------------------------------------------ sherpa-onnx


class _SherpaStream:  # pragma: no cover - needs the model
    def __init__(self, recognizer):
        self.rec = recognizer
        self.stream = recognizer.create_stream()
        self.pos = 0
        self.seg_start = 0.0
        self.last_text = ""

    def accept(self, audio: np.ndarray) -> list[LiveText]:
        self.stream.accept_waveform(SR, audio)
        self.pos += len(audio)
        while self.rec.is_ready(self.stream):
            self.rec.decode_stream(self.stream)
        text = self.rec.get_result(self.stream).strip()
        now = self.pos / SR
        out = []
        if self.rec.is_endpoint(self.stream):
            if text:
                out.append(LiveText("final", self.seg_start, now, text))
            self.rec.reset(self.stream)
            self.seg_start, self.last_text = now, ""
        elif text and text != self.last_text:
            self.last_text = text
            out.append(LiveText("partial", self.seg_start, now, text))
        return out

    def flush(self) -> list[LiveText]:
        self.stream.input_finished()
        while self.rec.is_ready(self.stream):
            self.rec.decode_stream(self.stream)
        text = self.rec.get_result(self.stream).strip()
        return [LiveText("final", self.seg_start, self.pos / SR, text)] if text else []

    def close(self) -> None:
        pass


class SherpaOnnxStreaming:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.name = f"sherpa-onnx:{Path(settings.sherpa_model_dir).name or 'unset'}"
        self._rec = None
        self._lock = threading.Lock()

    def _load(self):  # pragma: no cover - needs the model
        with self._lock:
            if self._rec is None:
                try:
                    import sherpa_onnx
                except ImportError as e:
                    raise ProviderError("sherpa-onnx is not installed (pip install sherpa-onnx)") from e
                d = Path(self.settings.sherpa_model_dir)
                if not d.is_dir():
                    raise ProviderError("SHERPA_MODEL_DIR must point at a sherpa-onnx streaming transducer folder")

                def pick(prefix: str) -> str:
                    found = sorted(d.glob(f"{prefix}*.onnx"), key=lambda p: ("int8" not in p.name, p.name))
                    if not found:
                        raise ProviderError(f"no {prefix}*.onnx in {d}")
                    return str(found[0])

                self._rec = sherpa_onnx.OnlineRecognizer.from_transducer(
                    tokens=str(d / "tokens.txt"),
                    encoder=pick("encoder"),
                    decoder=pick("decoder"),
                    joiner=pick("joiner"),
                    sample_rate=SR,
                    enable_endpoint_detection=True,
                    rule1_min_trailing_silence=1.2,
                    rule2_min_trailing_silence=0.6,
                    rule3_min_utterance_length=20,
                    provider="cuda" if self.settings.whisper_device == "cuda" else "cpu",
                )
        return self._rec

    def open(self, vocabulary: list[str] | None = None) -> LiveStream:  # pragma: no cover - needs the model
        return _SherpaStream(self._load())


# --------------------------------------------------------------------------------------- deepgram


class _DeepgramStream:  # pragma: no cover - needs the network
    def __init__(self, settings: Settings, vocabulary: list[str] | None):
        from urllib.parse import urlencode

        from websockets.sync.client import connect

        params = [
            ("model", settings.deepgram_model),
            ("encoding", "linear16"),
            ("sample_rate", str(SR)),
            ("channels", "1"),
            ("interim_results", "true"),
            ("endpointing", "300"),
            ("smart_format", "true"),
        ]
        if settings.whisper_language:
            params.append(("language", settings.whisper_language))
        key = "keyterm" if settings.deepgram_model.startswith("nova-3") else "keywords"
        params += [(key, t) for t in [*settings.glossary_terms, *(vocabulary or [])][:50]]
        self.ws = connect(
            "wss://api.deepgram.com/v1/listen?" + urlencode(params),
            additional_headers={"Authorization": f"Token {settings.deepgram_api_key}"},
        )
        self.results: queue.Queue[LiveText] = queue.Queue()
        self._reader = threading.Thread(target=self._read, daemon=True)
        self._reader.start()

    def _read(self) -> None:
        try:
            for msg in self.ws:
                data = json.loads(msg)
                if data.get("type") != "Results":
                    continue
                alt = (data.get("channel", {}).get("alternatives") or [{}])[0]
                text = (alt.get("transcript") or "").strip()
                if not text:
                    continue
                start = float(data.get("start", 0.0))
                end = start + float(data.get("duration", 0.0))
                self.results.put(LiveText("final" if data.get("is_final") else "partial", start, end, text))
        except Exception as e:  # connection closed
            log.info("deepgram stream closed: %s", e)

    def _drain(self) -> list[LiveText]:
        out = []
        while not self.results.empty():
            out.append(self.results.get_nowait())
        return out

    def accept(self, audio: np.ndarray) -> list[LiveText]:
        self.ws.send((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())
        return self._drain()

    def flush(self) -> list[LiveText]:
        try:
            self.ws.send(json.dumps({"type": "Finalize"}))
            self._reader.join(timeout=1.5)
        except Exception:
            pass
        return self._drain()

    def close(self) -> None:
        try:
            self.ws.send(json.dumps({"type": "CloseStream"}))
            self.ws.close()
        except Exception:
            pass


class DeepgramStreaming:
    def __init__(self, settings: Settings):
        if not settings.deepgram_api_key:
            raise ProviderError("DEEPGRAM_API_KEY is required when LIVE_STT_PROVIDER=deepgram")
        self.settings = settings
        self.name = f"deepgram-live:{settings.deepgram_model}"

    def open(self, vocabulary: list[str] | None = None) -> LiveStream:  # pragma: no cover - needs the network
        return _DeepgramStream(self.settings, vocabulary)
