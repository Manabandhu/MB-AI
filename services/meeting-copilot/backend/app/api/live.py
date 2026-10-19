"""Live assist: the audio gateway (WebSocket), answer cards, briefs and the standup draft.

WebSocket  /api/live/{meeting_id}?token=...&role=capture|view&channels=2&workspace=...
  capture  sends binary frames of 16 kHz PCM16LE audio (2 channels: left you, right the meeting)
           and JSON commands; receives every event.
  view     receives every event (a second screen, a phone, an overlay) and may send ask/feedback.
  Commands {"type": "ask", "question"} | {"type": "pause"} | {"type": "resume"} | {"type": "explain",
           "term"} | {"type": "translate", "to": "es"|null} | {"type": "feedback", "card_id", "value"}
           | {"type": "caption", "speaker", "text", "start", "end", "final"} | {"type": "stop"}

Browsers can't set headers on WebSockets, so the token travels as a query parameter (use HTTPS).
"""

import asyncio
import json
import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import Principal, authenticate, current_principal, get_db
from ..config import get_settings
from ..db import SYSTEM, new_session
from ..live.cards import CardContext, draft_card
from ..live.detector import Trigger
from ..live.hub import Viewer, hub, thread_spawner
from ..live.session import LiveSession
from ..models import LiveCard, Meeting
from ..pipeline.people import attendee_people
from ..pipeline.profiles import get_profile
from ..providers import ProviderError, get_embedder, get_live_llm, get_live_stt, get_llm, get_speaker_embedder
from ..services.brief import build_brief
from ..services.standup import draft_standup, rehearse
from ..storage import get_storage

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])
ws_router = APIRouter()


def new_session_for(meeting_id: str, principal: Principal, *, channels: int, emit, spawn) -> LiveSession:
    voiceprints = get_speaker_embedder()
    return LiveSession(
        meeting_id,
        principal,
        get_settings(),
        stt=get_live_stt(),
        llm=get_live_llm(),
        embedder=get_embedder(),
        voiceprints=None if voiceprints.name == "none" else voiceprints,
        storage=get_storage(),
        emit=emit,
        spawn=spawn,
        channels=channels,
    )


def ensure_session(meeting_id: str, principal: Principal, *, channels: int = 1, loop=None) -> LiveSession:
    """The meeting's live session, started on demand (captions from a bot need no capture client)."""
    existing = hub.session(meeting_id)
    if existing is not None:
        return existing
    emit = hub.emitter(meeting_id)
    session = new_session_for(meeting_id, principal, channels=channels, emit=emit, spawn=thread_spawner(loop, emit))
    hub.attach(meeting_id, session)
    session.start()
    return session


def record_feedback(scope_principal: Principal, card_id: int, value: int) -> None:
    with new_session(scope_principal.scope) as db:
        card = db.get(LiveCard, card_id)
        if card is None:
            raise LookupError("card not found")
        card.feedback = max(-1, min(1, int(value)))
        db.commit()


# ------------------------------------------------------------------------------------ WebSocket


async def _proxy(ws: WebSocket, meeting_id: str) -> None:
    """Forward to the live service (GPU box) when LIVE_UPSTREAM is set; it authenticates again."""
    import websockets

    url = f"{get_settings().live_upstream.rstrip('/')}/api/live/{meeting_id}?{urlencode(dict(ws.query_params))}"
    await ws.accept()
    try:
        async with websockets.connect(url, additional_headers={"x-copilot-upstream": "1"}, max_size=None) as up:

            async def client_to_up():
                while True:
                    msg = await ws.receive()
                    if msg["type"] == "websocket.disconnect":
                        await up.close()
                        return
                    await up.send(msg["bytes"] if msg.get("bytes") is not None else msg["text"])

            async def up_to_client():
                async for msg in up:
                    await (ws.send_bytes(msg) if isinstance(msg, bytes) else ws.send_text(msg))

            done, pending = await asyncio.wait(
                [asyncio.create_task(client_to_up()), asyncio.create_task(up_to_client())],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for t in pending:
                t.cancel()
    except Exception as e:
        log.warning("live upstream failed: %s", e)
        await ws.close(code=1011, reason="live service unavailable")


@ws_router.websocket("/api/live/{meeting_id}")
async def live_socket(
    ws: WebSocket,
    meeting_id: str,
    token: str = "",
    role: str = "capture",
    channels: int = 2,
    workspace: str | None = None,
):
    settings = get_settings()
    if settings.live_upstream and not ws.headers.get("x-copilot-upstream"):
        return await _proxy(ws, meeting_id)

    def auth() -> Principal:
        with new_session(SYSTEM) as s:
            return authenticate(s, token, workspace)

    try:
        principal = await asyncio.to_thread(auth)
    except HTTPException as e:
        await ws.close(code=4401 if e.status_code == 401 else 4403, reason=str(e.detail)[:120])
        return
    await ws.accept()
    loop = asyncio.get_running_loop()
    viewer = Viewer(loop, asyncio.Queue())

    session: LiveSession | None = None
    if role == "capture":
        if hub.session(meeting_id) is not None:
            await ws.send_json({"type": "error", "text": "this meeting is already being captured"})
            await ws.close(code=4409)
            return
        hub.join(meeting_id, viewer, replay=False)
        emit = hub.emitter(meeting_id)
        try:
            session = await asyncio.to_thread(
                new_session_for, meeting_id, principal, channels=channels, emit=emit, spawn=thread_spawner(loop, emit)
            )
        except (PermissionError, LookupError) as e:
            hub.leave(meeting_id, viewer)
            await ws.send_json({"type": "error", "text": str(e)})
            await ws.close(code=4403 if isinstance(e, PermissionError) else 4404)
            return
        hub.attach(meeting_id, session)
        await asyncio.to_thread(session.start)
    else:
        with new_session(principal.scope) as db:
            if db.get(Meeting, meeting_id) is None:
                await ws.close(code=4404)
                return
        hub.join(meeting_id, viewer)

    async def pump():
        while True:
            event = await viewer.queue.get()
            await ws.send_json(event)
            if event.get("type") == "stopped" and role == "capture":
                return

    sender = asyncio.create_task(pump())
    try:
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break
            if msg.get("bytes") is not None:
                if session is not None:
                    await asyncio.to_thread(session.feed_audio, msg["bytes"])
                continue
            try:
                cmd = json.loads(msg.get("text") or "{}")
            except ValueError:
                continue
            target = session or hub.session(meeting_id)
            kind = cmd.get("type")
            if kind == "feedback":
                await asyncio.to_thread(
                    record_feedback, principal, int(cmd.get("card_id", 0)), int(cmd.get("value", 0))
                )
            elif target is None:
                await ws.send_json({"type": "error", "text": "this meeting isn't live"})
            elif kind == "ask" and cmd.get("question"):
                await asyncio.to_thread(target.ask, str(cmd["question"])[:500])
            elif kind == "explain" and cmd.get("term"):
                await asyncio.to_thread(target.explain, str(cmd["term"])[:100])
            elif kind == "pause":
                await asyncio.to_thread(target.pause)
            elif kind == "resume":
                await asyncio.to_thread(target.resume)
            elif kind == "translate":
                await asyncio.to_thread(target.set_translation, cmd.get("to"))
            elif kind == "caption" and cmd.get("text"):
                await asyncio.to_thread(
                    target.feed_caption,
                    str(cmd.get("speaker") or "Speaker"),
                    str(cmd["text"]),
                    cmd.get("start"),
                    cmd.get("end"),
                    bool(cmd.get("final", True)),
                )
            elif kind == "stop" and session is not None:
                await asyncio.to_thread(session.stop)
                await asyncio.wait_for(sender, timeout=5)
                break
    except WebSocketDisconnect:
        pass
    finally:
        sender.cancel()
        hub.leave(meeting_id, viewer)
        if session is not None:
            await asyncio.to_thread(session.abandon)
            hub.detach(meeting_id)
        try:
            await ws.close()
        except RuntimeError:
            pass


# ----------------------------------------------------------------------------------------- REST


class CardOut(BaseModel):
    id: int
    kind: str
    trigger: str
    trigger_text: str
    at: float | None
    answer: str
    facts: list
    sources: list
    grounded: bool
    confidence: float
    timings_ms: dict
    feedback: int


class Feedback(BaseModel):
    value: int = Field(ge=-1, le=1)


class AskIn(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class CaptionIn(BaseModel):
    speaker: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=1, max_length=5000)
    start: float | None = None
    end: float | None = None
    final: bool = True


class RehearseIn(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


def _meeting(db: Session, meeting_id: str) -> Meeting:
    m = db.get(Meeting, meeting_id)
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "meeting not found")
    return m


@router.get("/meetings/{meeting_id}/live/cards", response_model=list[CardOut])
def list_cards(meeting_id: str, db: Session = Depends(get_db)):
    _meeting(db, meeting_id)
    rows = db.scalars(select(LiveCard).where(LiveCard.meeting_id == meeting_id).order_by(LiveCard.id))
    return [CardOut.model_validate(c, from_attributes=True) for c in rows]


@router.post("/live/cards/{card_id}/feedback", status_code=status.HTTP_204_NO_CONTENT)
def card_feedback(card_id: int, body: Feedback, principal: Principal = Depends(current_principal)):
    """Thumbs up/down. Feeds the Phase 3 gate (useful ≥ 80%) and tunes triggers and prompts."""
    try:
        record_feedback(principal, card_id, body.value)
    except LookupError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e)) from e


@router.post("/meetings/{meeting_id}/live/ask")
def ask_live(
    meeting_id: str, body: AskIn, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    """Ask during a meeting. With a live session the card arrives on the socket; otherwise it's returned."""
    m = _meeting(db, meeting_id)
    session = hub.session(meeting_id)
    if session is not None:
        session.ask(body.question)
        return {"status": "queued"}
    ctx = CardContext(
        principal.scope,
        meeting_id,
        principal.display_name,
        get_profile(m.profile, db),
        [p.id for p in attendee_people(db, m.attendees or [])],
    )
    db.commit()
    trig = Trigger("manual", body.question, body.question, principal.display_name, 0.0)
    try:
        return draft_card(ctx, trig, llm=get_live_llm(), embedder=get_embedder(), settings=get_settings(), context=[])
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e


@router.post("/meetings/{meeting_id}/live/captions", status_code=status.HTTP_202_ACCEPTED)
def push_caption(meeting_id: str, body: CaptionIn, principal: Principal = Depends(current_principal)):
    """Captions from a platform or bot. Starts a caption-only live session if none is running."""
    try:
        session = ensure_session(meeting_id, principal)
    except (PermissionError, LookupError) as e:
        raise HTTPException(status.HTTP_409_CONFLICT if isinstance(e, PermissionError) else 404, str(e)) from e
    session.feed_caption(body.speaker, body.text, body.start, body.end, body.final)
    return {"status": "accepted", "lines": len(session.lines)}


@router.post("/meetings/{meeting_id}/live/stop")
def stop_live(meeting_id: str, db: Session = Depends(get_db)):
    _meeting(db, meeting_id)
    session = hub.session(meeting_id)
    if session is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "this meeting isn't live")
    result = session.stop()
    hub.detach(meeting_id)
    return result


@router.get("/meetings/{meeting_id}/brief")
def meeting_brief(meeting_id: str, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    """Pre-meeting brief: attendees and your history with them, open commitments, linked docs."""
    m = _meeting(db, meeting_id)
    try:
        brief = build_brief(db, m, principal, get_settings(), llm=get_llm(), embedder=get_embedder())
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    db.commit()  # attendees join the people directory
    return brief


@router.post("/standup/draft")
def standup_draft(db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    """Yesterday / Today / Blockers from Jira, GitHub, CI and what you committed to last time."""
    try:
        return draft_standup(db, principal, get_llm(), get_settings())
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e


@router.post("/standup/rehearse")
def standup_rehearse(body: RehearseIn):
    """Rehearse mode: say (or type) your update; get it back tightened to under 60 seconds."""
    try:
        return rehearse(get_llm(), body.text)
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
