"""Provider factory. Each layer is picked by one environment variable (see config.py)."""

from ..config import Settings, get_settings
from .bot import AttendeeBot, FakeBot, MeetingBot, NoBot, RecallBot, VexaBot
from .diarization import Diarizer, NoDiarizer, PyannoteDiarizer
from .embeddings import BedrockTitanEmbedder, Embedder, OpenAICompatEmbedder
from .fakes import FakeDiarizer, FakeEmbedder, FakeLLM, FakeTranscriber
from .live_stt import (
    DeepgramStreaming,
    FakeStreamingTranscriber,
    FasterWhisperStreaming,
    NoStreamingTranscriber,
    SherpaOnnxStreaming,
    StreamingTranscriber,
)
from .llm import LLM, BedrockLLM, OpenAICompatLLM
from .stt import DeepgramTranscriber, FasterWhisperTranscriber, Transcriber
from .types import ProviderError, SpeakerTurn, TranscriptSegment
from .voiceprint import FakeSpeakerEmbedder, NoEmbedder, SpeakerEmbedder, SpeechBrainEmbedder

__all__ = [
    "Diarizer",
    "Embedder",
    "LLM",
    "ProviderError",
    "SpeakerEmbedder",
    "SpeakerTurn",
    "Transcriber",
    "TranscriptSegment",
    "get_bot",
    "get_diarizer",
    "get_embedder",
    "get_llm",
    "get_live_llm",
    "get_live_stt",
    "get_speaker_embedder",
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
    if kind == "bot":
        return {
            "attendee": lambda: AttendeeBot(settings),
            "vexa": lambda: VexaBot(settings),
            "recall": lambda: RecallBot(settings),
            "fake": FakeBot,
            "none": NoBot,
        }[settings.bot_provider]()
    if kind == "live_stt":
        return {
            "sherpa_onnx": lambda: SherpaOnnxStreaming(settings),
            "faster_whisper": lambda: FasterWhisperStreaming(settings),
            "deepgram": lambda: DeepgramStreaming(settings),
            "fake": FakeStreamingTranscriber,
            "none": NoStreamingTranscriber,
        }[settings.live_stt_provider]()
    if kind == "live_llm":  # a small fast model for answer cards, when configured
        if settings.llm_provider == "openai_compat" and settings.live_llm_model:
            return OpenAICompatLLM(settings.model_copy(update={"llm_model": settings.live_llm_model}))
        if settings.llm_provider == "bedrock" and settings.bedrock_live_model_id:
            return BedrockLLM(settings.model_copy(update={"bedrock_model_id": settings.bedrock_live_model_id}))
        return _get("llm")
    if kind == "voiceprint":
        return {
            "speechbrain": lambda: SpeechBrainEmbedder(settings),
            "none": NoEmbedder,
            "fake": lambda: FakeSpeakerEmbedder(settings.voiceprint_dim),
        }[settings.voiceprint_provider]()
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


def get_bot() -> MeetingBot:
    return _get("bot")  # type: ignore[return-value]


def get_live_stt() -> StreamingTranscriber:
    return _get("live_stt")  # type: ignore[return-value]


def get_live_llm() -> LLM:
    return _get("live_llm")  # type: ignore[return-value]


def get_speaker_embedder() -> SpeakerEmbedder:
    return _get("voiceprint")  # type: ignore[return-value]


def override_providers(**providers) -> None:
    """Tests: override_providers(stt=..., diarizer=..., llm=..., embedder=...)."""
    _cache.update(providers)


def reset_providers() -> None:
    _cache.clear()
