"""Test setup: real Postgres + pgvector, fake (model-free) providers, local storage in a temp dir.

Point TEST_DATABASE_URL at an empty database you don't mind being wiped, e.g.
  TEST_DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1:5432/copilot_test pytest
"""

import os
import tempfile
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

_TMP = Path(tempfile.mkdtemp(prefix="copilot-tests-"))
os.environ.update(
    {
        "DATABASE_URL": os.environ.get(
            "TEST_DATABASE_URL", "postgresql+psycopg://postgres@127.0.0.1:55432/copilot_test"
        ),
        "API_TOKEN": "test-token",
        "OWNER_NAME": "Sai",
        "STT_PROVIDER": "fake",
        "DIARIZER": "fake",
        "LLM_PROVIDER": "fake",
        "EMBED_PROVIDER": "fake",
        "EMBED_DIM": "64",
        "STORAGE_BACKEND": "local",
        "STORAGE_DIR": str(_TMP / "audio"),
        "WEB_DIST_DIR": str(_TMP / "no-web"),
        "AUDIO_RETENTION_DAYS": "30",
    }
)

from sqlalchemy import text  # noqa: E402

from app.db import get_engine, init_db  # noqa: E402
from app.providers import reset_providers  # noqa: E402
from app.storage import reset_storage  # noqa: E402

AUTH = {"Authorization": "Bearer test-token"}


@pytest.fixture
def db():
    engine = get_engine()
    with engine.begin() as conn:  # start from an empty schema so every migration runs
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    init_db()
    reset_providers()
    reset_storage()
    yield engine


@pytest.fixture
def client(db):
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:
        yield c


def tone(sr: int, seconds: float, freq: float, amp: float = 0.3) -> np.ndarray:
    t = np.arange(int(sr * seconds)) / sr
    return (amp * np.sin(2 * np.pi * freq * t)).astype(np.float32)


def write_audio(path: Path, duration: float, channels: list[list[tuple[float, float, float]]], sr: int = 16000) -> Path:
    """channels: per channel, a list of (start_s, end_s, freq_hz) tones. Everything else is silence."""
    data = np.zeros((int(sr * duration), len(channels)), dtype=np.float32)
    for ci, regions in enumerate(channels):
        for start, end, freq in regions:
            a, b = int(start * sr), int(end * sr)
            data[a:b, ci] = tone(sr, (b - a) / sr, freq)
    sf.write(str(path), data, sr)
    return path


@pytest.fixture
def tmp_audio(tmp_path):
    def make(name: str, duration: float, channels):
        return write_audio(tmp_path / name, duration, channels)

    return make
