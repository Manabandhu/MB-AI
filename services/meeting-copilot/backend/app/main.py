"""API server: `uvicorn app.main:app`. Also serves the built web UI at /."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .api import chat, meetings
from .auth import require_token
from .config import get_settings
from .db import get_engine, init_db
from .pipeline.profiles import PROFILES

log = logging.getLogger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    if not settings.api_token:
        log.warning("API_TOKEN is empty: every API call will be refused until it is set")
    init_db()
    yield


app = FastAPI(title="Meeting Copilot", version="0.1.0", lifespan=lifespan)
app.include_router(meetings.router)
app.include_router(meetings.media_router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/config", dependencies=[Depends(require_token)])
def config():
    s = get_settings()
    return {
        "owner_name": s.owner_name,
        "profiles": [{"key": p.key, "label": p.label} for p in PROFILES.values()],
        "audio_retention_days": s.audio_retention_days,
        "providers": {
            "stt": s.stt_provider,
            "diarizer": s.diarizer,
            "llm": s.llm_provider,
            "embeddings": s.embed_provider,
        },
    }


def _mount_web(app: FastAPI) -> None:
    dist = Path(get_settings().web_dist_dir).resolve()
    index = dist / "index.html"
    if not index.exists():
        log.info("web UI not built at %s; serving the API only", dist)
        return
    if (dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        candidate = (dist / path).resolve()
        if path and candidate.is_file() and dist in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(index)


_mount_web(app)
