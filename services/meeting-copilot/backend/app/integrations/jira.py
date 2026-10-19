"""Action items as Jira tickets: drafted automatically after each meeting, filed with one click."""

from datetime import date

import httpx

from ..models import ActionItem, Meeting
from .config import IntegrationConfig


def build_draft(item: ActionItem, m: Meeting, cfg: IntegrationConfig, link: str | None, due: date | None) -> dict:
    said = f" at {int(item.at) // 60}:{int(item.at) % 60:02d}" if item.at is not None else ""
    lines = [
        f'From "{m.title}" on {m.started_at:%Y-%m-%d}{said}.',
        f"Owner (as said in the meeting): {item.owner or 'unassigned'}.",
    ]
    if item.due:
        lines.append(f"Due (as said): {item.due}.")
    if link:
        lines.append(f"Meeting: {link}")
    draft = {
        "project": cfg.jira_project_key,
        "issue_type": cfg.jira_issue_type or "Task",
        "summary": item.text.strip()[:250],
        "description": "\n".join(lines),
        "owner": item.owner,
        "due_date": due.isoformat() if due else None,
    }
    return draft


def _adf(text: str) -> dict:
    return {
        "type": "doc",
        "version": 1,
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": line}]}
            for line in text.splitlines()
            if line.strip()
        ],
    }


def create_issue(cfg: IntegrationConfig, draft: dict, http: httpx.Client | None = None) -> str:
    if not cfg.jira_enabled:
        raise RuntimeError("Jira is not configured (base URL, email, API token and project key)")
    http = http or httpx.Client(timeout=20.0)
    fields = {
        "project": {"key": draft.get("project") or cfg.jira_project_key},
        "issuetype": {"name": draft.get("issue_type") or cfg.jira_issue_type},
        "summary": draft["summary"],
        "description": _adf(draft.get("description") or ""),
    }
    if draft.get("due_date"):
        fields["duedate"] = draft["due_date"]
    r = http.post(
        f"{cfg.jira_base_url.rstrip('/')}/rest/api/3/issue",
        json={"fields": fields},
        auth=(cfg.jira_email, cfg.jira_api_token),
        headers={"Accept": "application/json"},
    )
    if r.status_code >= 400:
        raise RuntimeError(f"Jira returned {r.status_code}: {r.text[:300]}")
    return r.json()["key"]
