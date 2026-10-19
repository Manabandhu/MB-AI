"""Integration settings: environment defaults, overridden per workspace (Settings → Integrations).

Secrets entered in the app are stored on the workspace row (the database is encrypted at rest with
KMS in the AWS deployment) and are never sent back to the browser: reads return them masked.
"""

from dataclasses import dataclass, fields

from sqlalchemy.orm import Session

from ..config import Settings
from ..db import SYSTEM, new_session
from ..models import Workspace

SECRET_KEYS = {"jira_api_token", "github_token", "slack_webhook_url", "teams_webhook_url", "calendar_ics_url"}


@dataclass
class IntegrationConfig:
    slack_webhook_url: str = ""
    teams_webhook_url: str = ""
    jira_base_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_key: str = ""
    jira_issue_type: str = "Task"
    github_token: str = ""
    github_username: str = ""
    github_repos: str = ""
    calendar_ics_url: str = ""
    auto_post_summaries: bool = False
    auto_draft_jira: bool = True

    @property
    def jira_enabled(self) -> bool:
        return bool(self.jira_base_url and self.jira_email and self.jira_api_token and self.jira_project_key)

    @property
    def repos(self) -> list[str]:
        return [r.strip() for r in self.github_repos.split(",") if r.strip()]

    def masked(self) -> dict:
        out = {}
        for f in fields(self):
            v = getattr(self, f.name)
            out[f.name] = ("••••" + v[-4:] if len(v) > 8 else "••••") if f.name in SECRET_KEYS and v else v
        return out


KEYS = {f.name for f in fields(IntegrationConfig)}


def integration_config(workspace_id: str, settings: Settings, session: Session | None = None) -> IntegrationConfig:
    def build(s: Session) -> IntegrationConfig:
        ws = s.get(Workspace, workspace_id)
        overrides = ((ws.settings or {}).get("integrations") or {}) if ws else {}
        base = {k: getattr(settings, k) for k in KEYS if hasattr(settings, k)}
        return IntegrationConfig(**{**base, **{k: v for k, v in overrides.items() if k in KEYS}})

    if session is not None:
        return build(session)
    with new_session(SYSTEM) as s:
        return build(s)


def save_integration_config(workspace_id: str, changes: dict) -> None:
    """Merge changes; a masked secret sent back unchanged keeps the stored value."""
    with new_session(SYSTEM) as s:
        ws = s.get(Workspace, workspace_id)
        current = dict((ws.settings or {}).get("integrations") or {})
        for k, v in changes.items():
            if k not in KEYS or (isinstance(v, str) and v.startswith("••••")):
                continue
            current[k] = v.strip() if isinstance(v, str) else v
        ws.settings = {**(ws.settings or {}), "integrations": current}
        s.commit()
