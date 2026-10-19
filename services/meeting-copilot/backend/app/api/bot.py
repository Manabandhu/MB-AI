"""Send a bot to a Teams, Zoom or Meet call. While it's there, its captions drive live assist; when
it leaves, the worker fetches its recording and per-participant transcript.
"""

import hmac
import logging

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import Principal, current_principal, get_db, principal_for, sign_value
from ..config import get_settings
from ..db import SYSTEM, new_session
from ..live.hub import hub
from ..models import Meeting, MeetingStatus
from ..privacy import third_party_providers
from ..providers import ProviderError, get_bot
from ..schemas import MeetingDetail
from .live import ensure_session
from .meetings import _detail, _get, record_consent

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])
webhook_router = APIRouter(prefix="/api")


class BotJoin(BaseModel):
    meeting_url: str = Field(min_length=8, max_length=1000)
    consent_confirmed: bool = False  # everyone was told; the bot's name also announces recording


def webhook_url(meeting_id: str) -> str:
    base = get_settings().public_base_url.rstrip("/")
    if not base:
        raise HTTPException(422, "set PUBLIC_BASE_URL so the bot provider can reach this server's webhook")
    return f"{base}/api/bot/webhook?mid={meeting_id}&sig={sign_value('bot-webhook', meeting_id)}"


@router.post("/meetings/{meeting_id}/bot", response_model=MeetingDetail)
def send_bot(
    meeting_id: str, body: BotJoin, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    m = _get(db, meeting_id)
    if m.consent_state != "confirmed":
        if not body.consent_confirmed:
            raise HTTPException(status.HTTP_409_CONFLICT, "confirm that everyone in the meeting knows it is recorded")
        record_consent(m, "bot_notice", principal, note="bot display name announces recording")
    if m.local_only and third_party_providers(get_settings()):
        raise HTTPException(status.HTTP_409_CONFLICT, "this meeting is local-only; the bot provider is a third party")
    try:
        info = get_bot().join(body.meeting_url.strip(), get_settings().bot_name, webhook_url(m.id))
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    m.bot_id, m.bot_status, m.meeting_url, m.source = info.id, info.status, body.meeting_url.strip(), "bot"
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


@router.delete("/meetings/{meeting_id}/bot", response_model=MeetingDetail)
def remove_bot(meeting_id: str, db: Session = Depends(get_db)):
    m = _get(db, meeting_id)
    if not m.bot_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "no bot was sent to this meeting")
    try:
        get_bot().leave(m.bot_id)
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    m.bot_status = "leaving"
    db.commit()
    return _detail(_get(db, meeting_id, detail=True))


def finish_bot_meeting(meeting_id: str) -> None:
    """The bot left: stop live assist and queue the bot's recording for the accurate pass."""
    session = hub.session(meeting_id)
    if session is not None:
        session.stop()
        hub.detach(meeting_id)
    with new_session(SYSTEM) as s:
        m = s.get(Meeting, meeting_id)
        if m is not None and m.status not in (MeetingStatus.PROCESSING,):
            m.status, m.requested_stage, m.stage, m.error = MeetingStatus.QUEUED, "bot", "waiting for worker", None
            s.commit()


@router.post("/meetings/{meeting_id}/bot/sync", response_model=MeetingDetail)
def sync_bot(meeting_id: str, db: Session = Depends(get_db)):
    """Poll the provider (for providers or networks where webhooks can't reach us)."""
    m = _get(db, meeting_id)
    if not m.bot_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "no bot was sent to this meeting")
    try:
        state = get_bot().status(m.bot_id)
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    m.bot_status = state
    db.commit()
    from ..providers.bot import ENDED

    if state in ENDED:
        finish_bot_meeting(meeting_id)
    db.expire_all()
    return _detail(_get(db, meeting_id, detail=True))


@webhook_router.post("/bot/webhook", status_code=status.HTTP_204_NO_CONTENT)
def bot_webhook(mid: str, sig: str, payload: dict = Body(...)):
    """Deliveries from the bot provider. Authenticated by our own HMAC in the URL we registered."""
    if not hmac.compare_digest(sig, sign_value("bot-webhook", mid)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "bad signature")
    event = get_bot().parse_webhook(payload)
    with new_session(SYSTEM) as s:
        m = s.get(Meeting, mid)
        if m is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "meeting not found")
        if event.bot_id and m.bot_id and event.bot_id != m.bot_id:
            return
        principal = principal_for(s, m.user_id, m.workspace_id, via="bot")
        if event.kind == "state":
            m.bot_status = event.state
            s.commit()
    if event.kind == "caption" and event.caption and event.caption.get("text"):
        try:
            session = ensure_session(mid, principal)
        except (PermissionError, LookupError) as e:
            log.warning("bot captions for %s ignored: %s", mid, e)
            return
        c = event.caption
        session.feed_caption(c["speaker"], c["text"], c.get("start"), c.get("end"), c.get("final", True))
    elif event.kind == "state" and event.ended:
        finish_bot_meeting(mid)
