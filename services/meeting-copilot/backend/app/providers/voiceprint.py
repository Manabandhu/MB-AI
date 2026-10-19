"""Speaker embeddings for opt-in voiceprints and live speaker matching.

Open source: SpeechBrain ECAPA-TDNN (192-dim). The match threshold is model-specific; calibrate it
on your own team's audio (GET /api/metrics/speakers suggests one) and re-tune if the model changes.

Only embeddings are stored. Enrollment audio is deleted as soon as it is embedded.
"""

import logging
import threading
from pathlib import Path
from typing import Protocol

import numpy as np
import soundfile as sf

from ..config import Settings
from .types import ProviderError

log = logging.getLogger(__name__)

MIN_SPAN_S = 0.8  # shorter speech carries too little voice to embed reliably


class SpeakerEmbedder(Protocol):
    name: str
    dim: int

    def embed_audio(self, audio: np.ndarray, sr: int) -> list[float]:
        """One L2-normalised embedding for a mono float32 signal."""
        ...


def normalize(v) -> list[float]:
    arr = np.asarray(v, dtype=np.float64).reshape(-1)
    n = float(np.linalg.norm(arr))
    return (arr / n).tolist() if n > 0 else arr.tolist()


def cosine(a, b) -> float:
    a, b = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    return float(a @ b / (na * nb)) if na and nb else 0.0


def mean_embedding(vectors: list[list[float]]) -> list[float] | None:
    if not vectors:
        return None
    return normalize(np.mean(np.asarray([normalize(v) for v in vectors]), axis=0))


def read_span(wav: Path, start: float, end: float) -> tuple[np.ndarray, int]:
    info = sf.info(str(wav))
    a, b = int(max(0.0, start) * info.samplerate), int(max(start, end) * info.samplerate)
    audio, sr = sf.read(str(wav), start=a, stop=min(b, info.frames), dtype="float32", always_2d=True)
    return audio.mean(axis=1), sr


def embed_spans(embedder: SpeakerEmbedder, wav: Path, spans: list[tuple[float, float]]) -> list[list[float]]:
    """Embed each span that is long enough. Spans are (start_s, end_s) in the given file."""
    out = []
    for start, end in spans:
        if end - start < MIN_SPAN_S:
            continue
        audio, sr = read_span(wav, start, end)
        if audio.size and float(np.abs(audio).max()) > 1e-4:
            out.append(embedder.embed_audio(audio, sr))
    return out


class SpeechBrainEmbedder:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.name = f"speechbrain:{settings.speechbrain_model}"
        self.dim = settings.voiceprint_dim
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._model is None:
                try:
                    import torch
                    from speechbrain.inference.speaker import EncoderClassifier
                except ImportError as e:  # pragma: no cover - depends on image
                    raise ProviderError(
                        "speechbrain is not installed. Use the worker image or set VOICEPRINT_PROVIDER=none"
                    ) from e
                device = "cuda" if torch.cuda.is_available() else "cpu"
                self._model = EncoderClassifier.from_hparams(
                    source=self.settings.speechbrain_model, run_opts={"device": device}
                )
        return self._model

    def embed_audio(self, audio: np.ndarray, sr: int) -> list[float]:  # pragma: no cover - needs the model
        import torch

        model = self._load()
        if sr != 16000:
            import torchaudio

            audio = torchaudio.functional.resample(torch.from_numpy(audio), sr, 16000).numpy()
        with torch.no_grad():
            emb = model.encode_batch(torch.from_numpy(audio).unsqueeze(0))
        vec = emb.squeeze().cpu().numpy()
        if vec.shape[0] != self.dim:
            raise ProviderError(f"{self.name} returned {vec.shape[0]}-dim embeddings but VOICEPRINT_DIM={self.dim}")
        return normalize(vec)


class NoEmbedder:
    name = "none"
    dim = 0

    def embed_audio(self, audio: np.ndarray, sr: int) -> list[float]:
        raise ProviderError("voiceprints are turned off (VOICEPRINT_PROVIDER=none)")


class FakeSpeakerEmbedder:
    """Pitch-based stand-in: test tones of the same frequency get near-identical embeddings."""

    name = "fake-voiceprint"

    def __init__(self, dim: int):
        self.dim = dim

    def embed_audio(self, audio: np.ndarray, sr: int) -> list[float]:
        crossings = np.count_nonzero(np.diff(np.signbit(audio)))
        freq = crossings * sr / (2 * max(1, len(audio)))
        center = (freq / 40.0) % self.dim
        idx = np.arange(self.dim)
        dist = np.minimum(np.abs(idx - center), self.dim - np.abs(idx - center))
        return normalize(np.exp(-(dist**2) / 2.0))
