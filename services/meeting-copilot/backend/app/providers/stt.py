"""Speech to text. Open source: faster-whisper. Paid: Deepgram."""

import logging
import threading
from pathlib import Path
from typing import Protocol

import httpx

from ..config import Settings
from .types import ProviderError, TranscriptSegment, Word

log = logging.getLogger(__name__)


class Transcriber(Protocol):
    name: str
    returns_speakers: bool  # True when the provider labels speakers itself

    def transcribe(self, wav_path: Path, diarize: bool = False) -> list[TranscriptSegment]: ...


class FasterWhisperTranscriber:
    returns_speakers = False

    def __init__(self, settings: Settings):
        self.settings = settings
        self.name = f"faster-whisper:{settings.whisper_model}"
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._model is None:
                try:
                    from faster_whisper import WhisperModel
                except ImportError as e:  # pragma: no cover - depends on image
                    raise ProviderError(
                        "faster-whisper is not installed. Use the worker image or pip install -r requirements-ml.txt"
                    ) from e
                log.info("loading whisper model %s on %s", self.settings.whisper_model, self.settings.whisper_device)
                self._model = WhisperModel(
                    self.settings.whisper_model,
                    device=self.settings.whisper_device,
                    compute_type=self.settings.whisper_compute_type,
                )
        return self._model

    def transcribe(self, wav_path: Path, diarize: bool = False) -> list[TranscriptSegment]:
        model = self._load()
        terms = self.settings.glossary_terms
        initial_prompt = ("Glossary: " + ", ".join(terms) + ".") if terms else None
        segments, _info = model.transcribe(
            str(wav_path),
            language=self.settings.whisper_language or None,
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,  # avoids repetition loops on long meetings
            initial_prompt=initial_prompt,
            word_timestamps=diarize,  # word timings let us split a segment where the speaker changes
        )
        out = []
        for seg in segments:  # generator: transcription happens while iterating
            text = seg.text.strip()
            if not text:
                continue
            words = [
                Word(start=float(w.start), end=float(w.end), text=w.word) for w in (getattr(seg, "words", None) or [])
            ]
            out.append(TranscriptSegment(start=float(seg.start), end=float(seg.end), text=text, words=words))
        return out


class DeepgramTranscriber:
    returns_speakers = True
    url = "https://api.deepgram.com/v1/listen"

    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        if not settings.deepgram_api_key:
            raise ProviderError("DEEPGRAM_API_KEY is required when STT_PROVIDER=deepgram")
        self.settings = settings
        self.name = f"deepgram:{settings.deepgram_model}"
        self.client = client or httpx.Client(timeout=httpx.Timeout(900.0, connect=20.0))

    def build_params(self, diarize: bool) -> list[tuple[str, str]]:
        s = self.settings
        params: list[tuple[str, str]] = [
            ("model", s.deepgram_model),
            ("smart_format", "true"),
            ("punctuate", "true"),
            ("utterances", "true"),
            ("diarize", "true" if diarize else "false"),
        ]
        if s.whisper_language:
            params.append(("language", s.whisper_language))
        # Nova-3 takes "keyterm" prompting; older models take "keywords".
        key = "keyterm" if s.deepgram_model.startswith("nova-3") else "keywords"
        params += [(key, term) for term in s.glossary_terms]
        return params

    def transcribe(self, wav_path: Path, diarize: bool = False) -> list[TranscriptSegment]:
        def body():
            with open(wav_path, "rb") as fh:
                while chunk := fh.read(1 << 20):
                    yield chunk

        resp = self.client.post(
            self.url,
            params=self.build_params(diarize),
            headers={
                "Authorization": f"Token {self.settings.deepgram_api_key}",
                "Content-Type": "audio/wav",
                "Content-Length": str(wav_path.stat().st_size),
            },
            content=body(),
        )
        if resp.status_code == 401:
            raise ProviderError("Deepgram rejected the API key (401)")
        if resp.status_code >= 400:
            raise ProviderError(f"Deepgram error {resp.status_code}: {resp.text[:300]}")
        return parse_deepgram_response(resp.json(), diarize)


def parse_deepgram_response(data: dict, diarize: bool) -> list[TranscriptSegment]:
    results = data.get("results") or {}
    out: list[TranscriptSegment] = []
    for utt in results.get("utterances") or []:
        text = (utt.get("transcript") or "").strip()
        if not text:
            continue
        speaker = utt.get("speaker")
        out.append(
            TranscriptSegment(
                start=float(utt["start"]),
                end=float(utt["end"]),
                text=text,
                speaker=f"dg{speaker}" if (diarize and speaker is not None) else None,
            )
        )
    if out or not results.get("channels"):
        return out
    # No utterances returned: fall back to one segment per channel transcript.
    for channel in results["channels"]:
        alts = channel.get("alternatives") or []
        if alts and alts[0].get("transcript", "").strip():
            words = alts[0].get("words") or []
            start = float(words[0]["start"]) if words else 0.0
            end = float(words[-1]["end"]) if words else 0.0
            out.append(TranscriptSegment(start=start, end=end, text=alts[0]["transcript"].strip()))
    return out
