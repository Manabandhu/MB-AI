"""What happens after a summary is written: action items become drafted Jira tickets, and the summary
posts to Slack or Teams when the workspace turned that on. Failures are logged, never fatal."""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import Settings
from ..integrations.config import integration_config
from ..integrations.jira import build_draft
from ..integrations.notify import post_webhook, slack_payload, teams_payload
from ..models import ActionItem, Commitment, Meeting, Summary, utcnow

log = logging.getLogger(__name__)


def meeting_link(settings: Settings, meeting_id: str) -> str | None:
    base = settings.public_base_url.rstrip("/")
    return f"{base}/meetings/{meeting_id}" if base else None


def draft_jira_tickets(session: Session, meeting: Meeting, settings: Settings) -> int:
    cfg = integration_config(meeting.workspace_id, settings)
    if not cfg.auto_draft_jira:
        return 0
    n = 0
    for item in session.scalars(select(ActionItem).where(ActionItem.meeting_id == meeting.id)):
        if item.jira_key:
            continue
        c = session.get(Commitment, item.commitment_id) if item.commitment_id else None
        item.jira_draft = build_draft(item, meeting, cfg, meeting_link(settings, meeting.id), c.due_date if c else None)
        n += 1
    return n


def post_summary(session: Session, meeting: Meeting, settings: Settings, targets: list[str] | None = None) -> list[str]:
    """Post to the configured channels. Returns the targets that succeeded."""
    cfg = integration_config(meeting.workspace_id, settings)
    summary = session.get(Summary, meeting.id)
    if summary is None:
        raise RuntimeError("this meeting has no summary yet")
    items = list(session.scalars(select(ActionItem).where(ActionItem.meeting_id == meeting.id)))
    link = meeting_link(settings, meeting.id)
    targets = targets or [t for t, url in (("slack", cfg.slack_webhook_url), ("teams", cfg.teams_webhook_url)) if url]
    done = []
    for t in targets:
        url = cfg.slack_webhook_url if t == "slack" else cfg.teams_webhook_url
        if not url:
            raise RuntimeError(f"{t} is not configured")
        payload = (slack_payload if t == "slack" else teams_payload)(meeting, summary.data, items, link)
        post_webhook(url, payload)
        done.append(t)
    if done:
        meeting.posted_at = utcnow()
    return done


def after_summary(session: Session, meeting: Meeting, settings: Settings) -> None:
    try:
        draft_jira_tickets(session, meeting, settings)
        session.commit()
    except Exception:
        session.rollback()
        log.exception("meeting %s: Jira drafts skipped", meeting.id)
    cfg = integration_config(meeting.workspace_id, settings)
    if cfg.auto_post_summaries and meeting.posted_at is None and (cfg.slack_webhook_url or cfg.teams_webhook_url):
        try:
            post_summary(session, meeting, settings)
            session.commit()
        except Exception:
            session.rollback()
            log.exception("meeting %s: posting the summary failed", meeting.id)
