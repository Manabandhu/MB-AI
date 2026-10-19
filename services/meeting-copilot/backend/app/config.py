"""Runtime configuration, read from environment variables (or a .env file).

Every model layer is switchable with one variable:
  STT_PROVIDER          faster_whisper | deepgram | fake               (post-meeting, accurate)
  LIVE_STT_PROVIDER     sherpa_onnx | faster_whisper | deepgram | fake | none   (during the meeting, fast)
  DIARIZER              pyannote | none | fake
  VOICEPRINT_PROVIDER   speechbrain | pyannoteai | fake | none
  LLM_PROVIDER          openai_compat | bedrock | fake
  EMBED_PROVIDER        openai_compat | bedrock | fake
  BOT_PROVIDER          attendee | vexa | recall | fake | none
"""

import secrets
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_EPHEMERAL_SECRET = secrets.token_hex(32)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- core -------------------------------------------------------------
    database_url: str = "postgresql+psycopg://copilot:copilot@localhost:5432/copilot"
    api_token: str = Field(default="", description="Bootstrap bearer token for the first (owner) user.")
    secret_key: str = ""  # signs media links and webhook URLs; defaults to API_TOKEN
    owner_name: str = "Me"  # display name of the bootstrap user (your mic channel)
    default_workspace_name: str = "Personal"
    web_dist_dir: str = "../web/dist"  # built React app served at /
    public_base_url: str = ""  # e.g. https://copilot.example.com; used in Slack/Teams links
    max_upload_mb: int = 1024
    log_level: str = "INFO"

    # --- single sign-on (OIDC: Keycloak, Cognito, Entra ID, Okta...) --------
    oidc_issuer: str = ""
    oidc_client_id: str = ""  # the web app's public client id (authorization code + PKCE)
    oidc_audience: str = ""  # defaults to the client id
    oidc_allowed_domains: str = ""  # comma separated email domains; empty = any
    oidc_scopes: str = "openid profile email"

    # --- storage ----------------------------------------------------------
    storage_backend: Literal["local", "s3"] = "local"
    storage_dir: str = "./data/audio"
    s3_bucket: str = ""
    aws_region: str = "us-east-1"
    audio_retention_days: int = 30  # 0 = keep audio forever; text is always kept

    # --- privacy ------------------------------------------------------------
    pii_redaction: bool = True  # mask emails, phone, card and SSN numbers in transcripts
    pii_categories: str = "email,phone,card,ssn"

    # --- speech to text (post-meeting) ----------------------------------------
    stt_provider: Literal["faster_whisper", "deepgram", "fake"] = "faster_whisper"
    whisper_model: str = "large-v3-turbo"  # use small.en or distil-small.en on CPU-only boxes
    whisper_device: str = "auto"  # auto | cpu | cuda
    whisper_compute_type: str = "default"  # default | int8 | float16 | int8_float16
    whisper_language: str = "en"  # empty string = auto-detect
    deepgram_api_key: str = ""
    deepgram_model: str = "nova-3"
    glossary: str = ""  # comma-separated team terms, fed to STT as custom vocabulary

    # --- speech to text (live) --------------------------------------------------
    live_stt_provider: Literal["sherpa_onnx", "faster_whisper", "deepgram", "fake", "none"] = "faster_whisper"
    live_whisper_model: str = "small.en"
    sherpa_model_dir: str = ""  # a sherpa-onnx streaming transducer (e.g. NeMo streaming FastConformer)
    live_upstream: str = ""  # ws://live:8001 when a separate GPU service runs live STT; empty = in-process

    # --- diarization ------------------------------------------------------
    diarizer: Literal["pyannote", "none", "fake"] = "pyannote"
    hf_token: str = ""
    pyannote_model: str = "pyannote/speaker-diarization-community-1"

    # --- voiceprints (opt-in speaker recognition) ---------------------------------
    voiceprint_provider: Literal["speechbrain", "pyannoteai", "fake", "none"] = "speechbrain"
    speechbrain_model: str = "speechbrain/spkrec-ecapa-voxceleb"
    pyannoteai_api_key: str = ""
    voiceprint_dim: int = 192  # ECAPA-TDNN embeddings
    # Cosine similarity needed to call a cluster a known person. Model-specific: calibrate it on
    # your own team's audio (GET /api/metrics/speakers) and re-tune when the model changes.
    voiceprint_threshold: float = 0.55

    # --- LLM ----------------------------------------------------------------
    llm_provider: Literal["openai_compat", "bedrock", "fake"] = "openai_compat"
    llm_base_url: str = "http://localhost:11434/v1"  # Ollama, vLLM, LM Studio, any OpenAI-style server
    llm_api_key: str = "not-needed"
    llm_model: str = "gpt-oss:20b"
    live_llm_model: str = ""  # a small fast model for answer cards; defaults to LLM_MODEL
    bedrock_model_id: str = ""  # e.g. a Claude inference profile id from the Bedrock console
    bedrock_live_model_id: str = ""  # defaults to BEDROCK_MODEL_ID
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
    retrieval_max_context_chars: int = 12_000

    # --- live assist --------------------------------------------------------
    live_question_window_s: float = 20.0
    live_summary_every_s: float = 300.0
    live_answer_min_score: float = 0.25  # below this retrieval similarity, the card says "not in your history"
    live_partial_every_s: float = 1.0

    # --- meeting bot --------------------------------------------------------
    bot_provider: Literal["attendee", "vexa", "recall", "fake", "none"] = "none"
    bot_name: str = "Meeting Copilot (recording)"  # the name says it records: all-party consent
    attendee_api_url: str = "https://app.attendee.dev"
    attendee_api_key: str = ""
    vexa_api_url: str = "http://localhost:8056"
    vexa_api_key: str = ""
    recall_api_url: str = "https://us-east-1.recall.ai"
    recall_api_key: str = ""
    bot_webhook_secret: str = ""

    # --- integrations (workspace settings override these) ---------------------
    slack_webhook_url: str = ""
    teams_webhook_url: str = ""
    jira_base_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_key: str = ""
    jira_issue_type: str = "Task"
    github_token: str = ""
    github_username: str = ""
    github_repos: str = ""  # owner/repo,owner/repo for CI status
    calendar_ics_url: str = ""
    auto_post_summaries: bool = False

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

    @property
    def signing_secret(self) -> str:
        return self.secret_key or self.api_token or _EPHEMERAL_SECRET

    @property
    def oidc_enabled(self) -> bool:
        return bool(self.oidc_issuer)

    @property
    def effective_oidc_audience(self) -> str:
        return self.oidc_audience or self.oidc_client_id

    @property
    def pii_category_set(self) -> set[str]:
        return {c.strip() for c in self.pii_categories.split(",") if c.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
