"""Who spoke when. Open source: pyannote Community-1."""

import logging
import threading
from pathlib import Path
from typing import Protocol

from ..config import Settings
from .types import ProviderError, SpeakerTurn

log = logging.getLogger(__name__)


class Diarizer(Protocol):
    name: str

    def diarize(self, wav_path: Path) -> list[SpeakerTurn]: ...


class NoDiarizer:
    """Everyone on the 'others' channel becomes one speaker."""

    name = "none"

    def diarize(self, wav_path: Path) -> list[SpeakerTurn]:
        return []


class PyannoteDiarizer:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.name = f"pyannote:{settings.pyannote_model}"
        self._pipeline = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._pipeline is None:
                try:
                    import torch
                    from pyannote.audio import Pipeline
                except ImportError as e:  # pragma: no cover - depends on image
                    raise ProviderError(
                        "pyannote.audio is not installed. Use the worker image or set DIARIZER=none"
                    ) from e
                if not self.settings.hf_token:
                    raise ProviderError(
                        "HF_TOKEN is required for pyannote (accept the model terms on Hugging Face first)"
                    )
                model = self.settings.pyannote_model
                try:  # pyannote.audio >= 4 uses `token`, 3.x used `use_auth_token`
                    pipeline = Pipeline.from_pretrained(model, token=self.settings.hf_token)
                except TypeError:
                    pipeline = Pipeline.from_pretrained(model, use_auth_token=self.settings.hf_token)
                if pipeline is None:
                    raise ProviderError(f"could not load {model}; check HF_TOKEN and the model's access terms")
                if torch.cuda.is_available():
                    pipeline.to(torch.device("cuda"))
                self._pipeline = pipeline
        return self._pipeline

    def diarize(self, wav_path: Path) -> list[SpeakerTurn]:
        import soundfile as sf
        import torch

        pipeline = self._load()
        # Pass the waveform in memory so pyannote does not need its own audio decoder.
        audio, sr = sf.read(str(wav_path), dtype="float32", always_2d=True)
        waveform = torch.from_numpy(audio.T.copy())
        output = pipeline({"waveform": waveform, "sample_rate": sr})
        annotation = _annotation_from(output)
        turns = [
            SpeakerTurn(start=float(seg.start), end=float(seg.end), speaker=str(label))
            for seg, _track, label in annotation.itertracks(yield_label=True)
        ]
        turns.sort(key=lambda t: t.start)
        return turns


def _annotation_from(output):
    """pyannote 4 returns an object with (exclusive_)speaker_diarization; 3.x returns the Annotation."""
    for attr in ("exclusive_speaker_diarization", "speaker_diarization"):
        ann = getattr(output, attr, None)
        if ann is not None:
            return ann
    return output
