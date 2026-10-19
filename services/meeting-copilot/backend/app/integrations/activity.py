"""Your recent work from Jira, GitHub and CI, for the pre-drafted standup update."""

import logging
from dataclasses import asdict, dataclass
from datetime import datetime

import httpx

from .config import IntegrationConfig

log = logging.getLogger(__name__)


@dataclass
class Activity:
    source: str  # github | jira | ci
    kind: str  # commit | pr | issue | run
    text: str
    url: str | None
    at: datetime | None

    def as_dict(self) -> dict:
        d = asdict(self)
        d["at"] = self.at.isoformat() if self.at else None
        return d


def _ts(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def github_activity(cfg: IntegrationConfig, since: datetime, http: httpx.Client) -> list[Activity]:
    if not (cfg.github_token and cfg.github_username):
        return []
    h = {"Authorization": f"Bearer {cfg.github_token}", "Accept": "application/vnd.github+json"}
    day = since.date().isoformat()
    out: list[Activity] = []
    r = http.get(
        "https://api.github.com/search/issues",
        params={"q": f"author:{cfg.github_username} is:pr updated:>={day}", "per_page": 20},
        headers=h,
    )
    r.raise_for_status()
    for pr in r.json().get("items", []):
        state = "merged" if (pr.get("pull_request") or {}).get("merged_at") else pr.get("state", "open")
        repo = pr.get("repository_url", "").rsplit("/", 1)[-1]
        out.append(
            Activity(
                "github",
                "pr",
                f"{repo}#{pr['number']} {pr['title']} ({state})",
                pr.get("html_url"),
                _ts(pr.get("updated_at")),
            )
        )
    r = http.get(
        "https://api.github.com/search/commits",
        params={"q": f"author:{cfg.github_username} author-date:>={day}", "per_page": 20, "sort": "author-date"},
        headers=h,
    )
    if r.status_code < 400:
        for c in r.json().get("items", []):
            msg = (c.get("commit", {}).get("message") or "").split("\n")[0]
            repo = (c.get("repository") or {}).get("name", "")
            out.append(
                Activity(
                    "github",
                    "commit",
                    f"{repo}: {msg}",
                    c.get("html_url"),
                    _ts(c.get("commit", {}).get("author", {}).get("date")),
                )
            )
    for repo in cfg.repos:
        r = http.get(
            f"https://api.github.com/repos/{repo}/actions/runs",
            params={"actor": cfg.github_username, "created": f">={day}", "per_page": 10},
            headers=h,
        )
        if r.status_code >= 400:
            continue
        for run in r.json().get("workflow_runs", []):
            if run.get("conclusion") in ("failure", "timed_out"):
                out.append(
                    Activity(
                        "ci",
                        "run",
                        f"{repo}: {run.get('name')} failed on {run.get('head_branch')}",
                        run.get("html_url"),
                        _ts(run.get("updated_at")),
                    )
                )
    return out


def jira_activity(cfg: IntegrationConfig, since: datetime, http: httpx.Client) -> list[Activity]:
    if not cfg.jira_enabled:
        return []
    days = max(1, (datetime.now(since.tzinfo) - since).days + 1)
    r = http.get(
        f"{cfg.jira_base_url.rstrip('/')}/rest/api/3/search/jql",
        params={
            "jql": f"assignee = currentUser() AND updated >= -{days}d ORDER BY updated DESC",
            "fields": "summary,status,updated",
            "maxResults": 20,
        },
        auth=(cfg.jira_email, cfg.jira_api_token),
        headers={"Accept": "application/json"},
    )
    r.raise_for_status()
    out = []
    for issue in r.json().get("issues", []):
        f = issue.get("fields", {})
        status = (f.get("status") or {}).get("name", "")
        out.append(
            Activity(
                "jira",
                "issue",
                f"{issue['key']} {f.get('summary', '')} ({status})",
                f"{cfg.jira_base_url.rstrip('/')}/browse/{issue['key']}",
                _ts(f.get("updated")),
            )
        )
    return out


def collect_activity(cfg: IntegrationConfig, since: datetime, http: httpx.Client | None = None) -> list[Activity]:
    """Best effort: a failing source is logged and skipped, never fatal to the draft."""
    http = http or httpx.Client(timeout=10.0)
    out: list[Activity] = []
    for fetch in (jira_activity, github_activity):
        try:
            out += fetch(cfg, since, http)
        except Exception as e:  # network, auth, rate limit
            log.warning("activity from %s skipped: %s", fetch.__name__, e)
    return sorted(out, key=lambda a: a.at or since, reverse=True)
