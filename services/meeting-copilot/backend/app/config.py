"""Runtime configuration, read from environment variables (or a .env file).

Every model layer is switchable with one variable:
  STT_PROVIDER    faster_whisper | deepgram | fake
  DIARIZER        pyannote | none | fake
  LLM_PROVIDER    openai_compat | bedrock | fake
  EMBED_PROVIDER  openai_compat | bedrock | fake
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- core -------------------------------------------------------------
    database_url: str = "postgresql+psycopg://copilot:copilot@localhost:5432/copilot"
    api_token: str = Field(default="", description="Bearer token for the single user. Required.")
    owner_name: str = "Me"  # display name for the mic channel (you)
    web_dist_dir: str = "../web/dist"  # built React app served at /
    max_upload_mb: int = 1024
    log_level: str = "INFO"

    # --- storage ----------------------------------------------------------
    storage_backend: Literal["local", "s3"] = "local"
    storage_dir: str = "./data/audio"
    s3_bucket: str = ""
    aws_region: str = "us-east-1"
    audio_retention_days: int = 30  # 0 = keep audio forever; text is always kept

    # --- speech to text ---------------------------------------------------
    stt_provider: Literal["faster_whisper", "deepgram", "fake"] = "faster_whisper"
    whisper_model: str = "large-v3-turbo"  # use small.en or distil-small.en on CPU-only boxes
    whisper_device: str = "auto"  # auto | cpu | cuda
    whisper_compute_type: str = "default"  # default | int8 | float16 | int8_float16
    whisper_language: str = "en"  # empty string = auto-detect
    deepgram_api_key: str = ""
    deepgram_model: str = "nova-3"
    glossary: str = ""  # comma-separated team terms, fed to STT as custom vocabulary

    # --- diarization ------------------------------------------------------
    diarizer: Literal["pyannote", "none", "fake"] = "pyannote"
    hf_token: str = ""
    pyannote_model: str = "pyannote/speaker-diarization-community-1"

    # --- LLM ----------------------------------------------------------------
    llm_provider: Literal["openai_compat", "bedrock", "fake"] = "openai_compat"
    llm_base_url: str = "http://localhost:11434/v1"  # Ollama, vLLM, LM Studio, any OpenAI-style server
    llm_api_key: str = "not-needed"
    llm_model: str = "gpt-oss:20b"
    bedrock_model_id: str = ""  # e.g. a Claude inference profile id from the Bedrock console
    bedrock_region: str = ""  # defaults to aws_region
    llm_timeout_s: float = 300.0
    llm_max_input_chars: int = 48_000  # longer transcripts are summarized map-reduce style

    # --- embeddings -------------------------------------------------------
    embed_provider: Literal["openai_compat", "bedrock", "fake"] = "openai_compat"
    embed_base_url: str = "http://localhost:11434/v1"
    embed_api_key: str = "not-needed"
    embed_model: str = "nomic-embed-text"
    bedrock_embed_model_id: str = "amazon.titan-embed-text-v2:0"
    embed_dim: int = 768  # must match the model; changing it needs a re-index (see README)

    # --- retrieval ----------------------------------------------------------
    chat_top_k: int = 8

    @field_validator("glossary")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @property
    def glossary_terms(self) -> list[str]:
        return [t.strip() for t in self.glossary.split(",") if t.strip()]

    @property
    def effective_bedrock_region(self) -> str:
        return self.bedrock_region or self.aws_region


@lru_cache
def get_settings() -> Settings:
    return Settings()
