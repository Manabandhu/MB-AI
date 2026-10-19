"""API server: `uvicorn app.main:app`. Also serves the built web UI at /."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from .api import chat, live, meetings, memory, metrics, people, workspace
from .auth import Principal, current_principal, get_db
from .config import get_settings
from .db import get_engine, init_db
from .pipeline.profiles import all_profiles

log = logging.getLogger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    if not settings.api_token and not settings.oidc_enabled:
        log.warning("neither API_TOKEN nor OIDC_ISSUER is set: every API call will be refused")
    init_db()
    yield


app = FastAPI(title="Meeting Copilot", version="0.2.0", lifespan=lifespan)
app.include_router(meetings.router)
app.include_router(meetings.media_router)
app.include_router(chat.router)
app.include_router(workspace.router)
app.include_router(people.router)
app.include_router(metrics.router)
app.include_router(memory.router)
app.include_router(live.router)
app.include_router(live.ws_router)


@app.get("/api/health")
def health():
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/auth-config")
def auth_config():
    """Public: tells the sign-in page whether SSO is available."""
    s = get_settings()
    return {
        "token": bool(s.api_token),
        "oidc": {"issuer": s.oidc_issuer, "client_id": s.oidc_client_id, "scopes": s.oidc_scopes}
        if s.oidc_enabled and s.oidc_client_id
        else None,
    }


@app.get("/api/config")
def config(principal: Principal = Depends(current_principal), db: Session = Depends(get_db)):
    s = get_settings()
    return {
        "owner_name": principal.display_name,
        "user_id": principal.user_id,
        "workspace_id": principal.workspace_id,
        "role": principal.role,
        "profiles": [p.as_dict() for p in all_profiles(db).values()],
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
