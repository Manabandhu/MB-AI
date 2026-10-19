"""Integrations (Phase 5): settings, Slack/Teams posting, Jira tickets, and the calendar."""

from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import Principal, audit, current_principal, get_db, require_owner
from ..config import get_settings
from ..integrations.activity import collect_activity
from ..integrations.calendar import fetch_events
from ..integrations.config import integration_config, save_integration_config
from ..integrations.jira import create_issue
from ..models import ActionItem, Commitment, Meeting
from ..pipeline.profiles import detect_profile
from ..providers import ProviderError, get_embedder, get_llm
from ..services.brief import build_brief
from ..services.outputs import post_summary

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])


class IntegrationsIn(BaseModel):
    slack_webhook_url: str | None = None
    teams_webhook_url: str | None = None
    jira_base_url: str | None = None
    jira_email: str | None = None
    jira_api_token: str | None = None
    jira_project_key: str | None = None
    jira_issue_type: str | None = None
    github_token: str | None = None
    github_username: str | None = None
    github_repos: str | None = None
    calendar_ics_url: str | None = None
    auto_post_summaries: bool | None = None
    auto_draft_jira: bool | None = None


class TestIn(BaseModel):
    target: str = Field(pattern="^(slack|teams|jira|github|calendar)$")


class PostIn(BaseModel):
    targets: list[str] = Field(default_factory=list)


class JiraDraft(BaseModel):
    summary: str = Field(min_length=1, max_length=250)
    description: str = ""
    project: str | None = None
    issue_type: str | None = None
    due_date: str | None = None


class PrepareIn(BaseModel):
    key: str  # CalendarEvent.key from GET /api/calendar/events


@router.get("/integrations")
def get_integrations(principal: Principal = Depends(current_principal)):
    """Secrets come back masked (••••abcd); send a masked value back unchanged to keep it."""
    cfg = integration_config(principal.workspace_id, get_settings())
    return {**cfg.masked(), "jira_enabled": cfg.jira_enabled}


@router.put("/integrations")
def put_integrations(body: IntegrationsIn, request: Request, principal: Principal = Depends(require_owner)):
    changes = {k: v for k, v in body.model_dump().items() if v is not None}
    save_integration_config(principal.workspace_id, changes)
    from ..db import new_session

    with new_session(principal.scope) as db:
        audit(
            db, principal, "integrations_update", "workspace", principal.workspace_id, request, fields=sorted(changes)
        )
        db.commit()
    return get_integrations(principal)


@router.post("/integrations/test")
def test_integration(body: TestIn, principal: Principal = Depends(current_principal)):
    cfg = integration_config(principal.workspace_id, get_settings())
    try:
        if body.target in ("slack", "teams"):
            from ..integrations.notify import post_webhook

            url = cfg.slack_webhook_url if body.target == "slack" else cfg.teams_webhook_url
            if not url:
                raise RuntimeError(f"{body.target} is not configured")
            payload = (
                {"text": "Meeting Copilot is connected."}
                if body.target == "slack"
                else {
                    "type": "message",
                    "attachments": [
                        {
                            "contentType": "application/vnd.microsoft.card.adaptive",
                            "content": {
                                "type": "AdaptiveCard",
                                "version": "1.4",
                                "body": [{"type": "TextBlock", "text": "Meeting Copilot is connected."}],
                            },
                        }
                    ],
                }
            )
            post_webhook(url, payload)
            return {"ok": True, "detail": "test message sent"}
        if body.target == "jira":
            if not cfg.jira_enabled:
                raise RuntimeError("Jira is not configured")
            r = httpx.get(
                f"{cfg.jira_base_url.rstrip('/')}/rest/api/3/myself",
                auth=(cfg.jira_email, cfg.jira_api_token),
                timeout=15.0,
            )
            r.raise_for_status()
            return {"ok": True, "detail": f"signed in as {r.json().get('displayName')}"}
        if body.target == "github":
            items = collect_activity(cfg, datetime.now(UTC).replace(hour=0, minute=0))
            return {"ok": True, "detail": f"{len(items)} item(s) of activity today"}
        if not cfg.calendar_ics_url:
            raise RuntimeError("no calendar feed is configured")
        return {"ok": True, "detail": f"{len(fetch_events(cfg.calendar_ics_url, days=7))} upcoming event(s)"}
    except Exception as e:
        return {"ok": False, "detail": str(e)[:300]}


@router.post("/meetings/{meeting_id}/post")
def post_meeting(meeting_id: str, body: PostIn, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "meeting not found")
    try:
        done = post_summary(db, m, get_settings(), body.targets or None)
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    if not done:
        raise HTTPException(status.HTTP_409_CONFLICT, "no Slack or Teams webhook is configured")
    db.commit()
    return {"posted": done}


def _item(db: Session, item_id: int) -> ActionItem:
    item = db.get(ActionItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "action item not found")
    return item


@router.get("/action-items/{item_id}/jira")
def get_jira_draft(item_id: int, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    item = _item(db, item_id)
    if item.jira_draft is None:
        from ..services.outputs import draft_jira_tickets

        m = db.get(Meeting, item.meeting_id)
        draft_jira_tickets(db, m, get_settings())
        db.commit()
    return {"key": item.jira_key, "draft": item.jira_draft}


@router.put("/action-items/{item_id}/jira")
def edit_jira_draft(item_id: int, body: JiraDraft, db: Session = Depends(get_db)):
    item = _item(db, item_id)
    item.jira_draft = {**(item.jira_draft or {}), **body.model_dump(exclude_none=True)}
    db.commit()
    return {"key": item.jira_key, "draft": item.jira_draft}


@router.post("/action-items/{item_id}/jira")
def file_jira(
    item_id: int, request: Request, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    """File the drafted ticket in Jira. The issue key is kept on the item and its commitment."""
    item = _item(db, item_id)
    if item.jira_key:
        raise HTTPException(status.HTTP_409_CONFLICT, f"already filed as {item.jira_key}")
    if item.jira_draft is None:
        get_jira_draft(item_id, db, principal)
    cfg = integration_config(principal.workspace_id, get_settings())
    try:
        key = create_issue(cfg, item.jira_draft)
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    item.jira_key = key
    if item.commitment_id and (c := db.get(Commitment, item.commitment_id)):
        c.jira_key = key
    audit(db, principal, "jira_create", "action_item", str(item.id), request, key=key)
    db.commit()
    return {"key": key, "url": f"{cfg.jira_base_url.rstrip('/')}/browse/{key}"}


# -------------------------------------------------------------------------------------- calendar


@router.get("/calendar/events")
def calendar_events(
    days: int = Query(7, ge=1, le=31), db: Session = Depends(get_db), principal: Principal = Depends(current_principal)
):
    """Upcoming events from the workspace's calendar feed, each with a detected meeting type."""
    cfg = integration_config(principal.workspace_id, get_settings())
    if not cfg.calendar_ics_url:
        return {"configured": False, "events": []}
    try:
        events = fetch_events(cfg.calendar_ics_url, days=days)
    except Exception as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"couldn't read the calendar: {e}") from e
    prepared = {
        m.calendar_event_id: m.id
        for m in db.scalars(select(Meeting).where(Meeting.calendar_event_id.in_([e.key for e in events])))
    }
    out = []
    for e in events:
        profile, confidence = detect_profile(e.title, e.attendees, e.description[:500], db)
        out.append(
            {
                "key": e.key,
                "title": e.title,
                "start": e.start.isoformat(),
                "end": e.end.isoformat() if e.end else None,
                "attendees": e.attendees,
                "organizer": e.organizer,
                "location": e.location,
                "meeting_url": e.meeting_url,
                "links": e.links,
                "profile": profile,
                "profile_confidence": confidence,
                "meeting_id": prepared.get(e.key),
            }
        )
    return {"configured": True, "events": out}


@router.post("/calendar/prepare")
def prepare_event(body: PrepareIn, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    """Before: a calendar event is picked up, a profile is chosen (override later), and a brief is built."""
    events = calendar_events(31, db, principal)["events"]
    ev = next((e for e in events if e["key"] == body.key), None)
    if ev is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "event not found in the next 31 days")
    if ev["meeting_id"]:
        m = db.get(Meeting, ev["meeting_id"])
    else:
        m = Meeting(
            title=ev["title"][:300],
            profile=ev["profile"],
            profile_source="auto",
            started_at=datetime.fromisoformat(ev["start"]),
            attendees=ev["attendees"][:50],
            calendar_event_id=ev["key"],
            links=[{"title": "", "url": u} for u in ev["links"]],
            meeting_url=ev["meeting_url"],
            consent_log=[],
        )
        db.add(m)
        db.commit()
    try:
        brief = build_brief(db, m, principal, get_settings(), llm=get_llm(), embedder=get_embedder())
    except ProviderError as e:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(e)) from e
    db.commit()
    return {"meeting_id": m.id, "brief": brief}
