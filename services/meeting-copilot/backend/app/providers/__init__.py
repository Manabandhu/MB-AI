"""Provider factory. Each layer is picked by one environment variable (see config.py)."""

from ..config import Settings, get_settings
from .diarization import Diarizer, NoDiarizer, PyannoteDiarizer
from .embeddings import BedrockTitanEmbedder, Embedder, OpenAICompatEmbedder
from .fakes import FakeDiarizer, FakeEmbedder, FakeLLM, FakeTranscriber
from .llm import LLM, BedrockLLM, OpenAICompatLLM
from .stt import DeepgramTranscriber, FasterWhisperTranscriber, Transcriber
from .types import ProviderError, SpeakerTurn, TranscriptSegment

__all__ = [
    "Diarizer",
    "Embedder",
    "LLM",
    "ProviderError",
    "SpeakerTurn",
    "Transcriber",
    "TranscriptSegment",
    "get_diarizer",
    "get_embedder",
    "get_llm",
    "get_transcriber",
    "override_providers",
    "reset_providers",
]

_cache: dict[str, object] = {}


def _build(kind: str, settings: Settings):
    if kind == "stt":
        return {
            "faster_whisper": lambda: FasterWhisperTranscriber(settings),
            "deepgram": lambda: DeepgramTranscriber(settings),
            "fake": FakeTranscriber,
        }[settings.stt_provider]()
    if kind == "diarizer":
        return {
            "pyannote": lambda: PyannoteDiarizer(settings),
            "none": NoDiarizer,
            "fake": FakeDiarizer,
        }[settings.diarizer]()
    if kind == "llm":
        return {
            "openai_compat": lambda: OpenAICompatLLM(settings),
            "bedrock": lambda: BedrockLLM(settings),
            "fake": FakeLLM,
        }[settings.llm_provider]()
    if kind == "embedder":
        return {
            "openai_compat": lambda: OpenAICompatEmbedder(settings),
            "bedrock": lambda: BedrockTitanEmbedder(settings),
            "fake": lambda: FakeEmbedder(settings.embed_dim),
        }[settings.embed_provider]()
    raise KeyError(kind)


def _get(kind: str):
    if kind not in _cache:
        _cache[kind] = _build(kind, get_settings())
    return _cache[kind]


def get_transcriber() -> Transcriber:
    return _get("stt")  # type: ignore[return-value]


def get_diarizer() -> Diarizer:
    return _get("diarizer")  # type: ignore[return-value]


def get_llm() -> LLM:
    return _get("llm")  # type: ignore[return-value]


def get_embedder() -> Embedder:
    return _get("embedder")  # type: ignore[return-value]


def override_providers(**providers) -> None:
    """Tests: override_providers(stt=..., diarizer=..., llm=..., embedder=...)."""
    _cache.update(providers)


def reset_providers() -> None:
    _cache.clear()
