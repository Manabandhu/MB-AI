"""Phase 5: Slack/Teams, Jira, calendar, rollups, missed-meeting digests and the blocker radar."""

import json
from datetime import UTC, datetime, timedelta

import httpx

from app.integrations.calendar import parse_ics
from app.integrations.config import IntegrationConfig
from app.integrations.jira import create_issue

from .conftest import AUTH
from .helpers import text_meeting

ICS = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//EN
BEGIN:VEVENT
UID:standup-1
SUMMARY:Daily standup
DTSTART:{d1}
DTEND:{d1e}
RRULE:FREQ=DAILY;COUNT=3
ATTENDEE;CN=Priya Rao:mailto:priya@corp.com
ATTENDEE;CN=Sai:mailto:sai@corp.com
LOCATION:https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc
END:VEVENT
BEGIN:VEVENT
UID:acme-1
SUMMARY:Acme renewal call
DTSTART:{d2}
DTEND:{d2e}
ATTENDEE;CN=Dana:mailto:dana@acme.com
DESCRIPTION:Join https://zoom.us/j/98765 . Contract: https://docs.example.com/acme
END:VEVENT
BEGIN:VEVENT
UID:gone
SUMMARY:Cancelled thing
STATUS:CANCELLED
DTSTART:{d2}
END:VEVENT
END:VCALENDAR
"""


def _ics(now: datetime) -> str:
    def f(dt):
        return dt.strftime("%Y%m%dT%H%M%SZ")

    d1 = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
    d2 = d1 + timedelta(hours=3)
    return ICS.format(d1=f(d1), d1e=f(d1 + timedelta(minutes=15)), d2=f(d2), d2e=f(d2 + timedelta(minutes=30)))


def test_integration_settings_are_masked_and_owner_only(client):
    body = {
        "slack_webhook_url": "https://hooks.slack.com/services/T/B/secret1234",
        "jira_project_key": "OPS",
        "auto_post_summaries": True,
    }
    r = client.put("/api/integrations", json=body, headers=AUTH).json()
    assert r["slack_webhook_url"] == "••••1234" and r["jira_project_key"] == "OPS" and r["auto_post_summaries"]
    # Sending the masked value back keeps the secret.
    client.put("/api/integrations", json={"slack_webhook_url": "••••1234", "jira_issue_type": "Bug"}, headers=AUTH)
    from app.config import get_settings
    from app.integrations.config import integration_config

    ws = client.get("/api/me", headers=AUTH).json()["workspace_id"]
    cfg = integration_config(ws, get_settings())
    assert cfg.slack_webhook_url.endswith("secret1234") and cfg.jira_issue_type == "Bug"
    team = client.post("/api/workspaces", json={"name": "T"}, headers=AUTH).json()
    added = client.post(
        "/api/workspace/members",
        json={"email": "m@x.com", "issue_token": True},
        headers=AUTH | {"X-Workspace-Id": team["id"]},
    ).json()
    member = {"Authorization": f"Bearer {added['token']}", "X-Workspace-Id": team["id"]}
    assert client.put("/api/integrations", json={"jira_project_key": "X"}, headers=member).status_code == 403
    assert any(e["action"] == "integrations_update" for e in client.get("/api/audit", headers=AUTH).json())


def test_summaries_post_and_action_items_become_jira_drafts(client, monkeypatch):
    sent = []
    from app.services import outputs

    monkeypatch.setattr(outputs, "post_webhook", lambda url, payload: sent.append((url, payload)))
    client.put(
        "/api/integrations",
        json={
            "slack_webhook_url": "https://hooks.slack.com/services/x",
            "teams_webhook_url": "https://example.webhook/x",
            "auto_post_summaries": True,
            "jira_project_key": "OPS",
        },
        headers=AUTH,
    )
    d = text_meeting(
        client,
        "Standup",
        [("Sai", "I'll send the runbook link by Friday."), ("Priya", "Let's decide to move the cutover to Thursday.")],
    )
    assert {u for u, _p in sent} == {"https://hooks.slack.com/services/x", "https://example.webhook/x"}
    slack = next(p for u, p in sent if "slack" in u)
    assert slack["blocks"][0]["text"]["text"] == "Standup" and "runbook" in json.dumps(slack)
    teams = next(p for u, p in sent if "webhook" in u)
    assert teams["attachments"][0]["contentType"] == "application/vnd.microsoft.card.adaptive"

    # Already posted: reprocessing doesn't post twice. Manual posts still work.
    n = len(sent)
    client.post(f"/api/meetings/{d['id']}/reprocess", json={"stage": "summarize"}, headers=AUTH)
    from app.worker import build_providers, run_once

    run_once(build_providers())
    assert len(sent) == n
    assert client.post(f"/api/meetings/{d['id']}/post", json={"targets": ["slack"]}, headers=AUTH).json() == {
        "posted": ["slack"]
    }

    item = client.get(f"/api/meetings/{d['id']}", headers=AUTH).json()["action_items"][0]  # re-summarized: new ids
    draft = client.get(f"/api/action-items/{item['id']}/jira", headers=AUTH).json()["draft"]
    assert draft["project"] == "OPS" and draft["summary"].startswith("I'll send the runbook link")
    assert draft["due_date"] and "Standup" in draft["description"]
    client.put(f"/api/action-items/{item['id']}/jira", json={"summary": "Send runbook link to Priya"}, headers=AUTH)

    filed = []
    from app.api import integrations

    def fake_create(cfg, draft):
        filed.append(draft)
        return "OPS-101"

    monkeypatch.setattr(integrations, "create_issue", fake_create)
    r = client.post(f"/api/action-items/{item['id']}/jira", headers=AUTH).json()
    assert r["key"] == "OPS-101" and filed[0]["summary"] == "Send runbook link to Priya"
    assert client.post(f"/api/action-items/{item['id']}/jira", headers=AUTH).status_code == 409
    c = client.get("/api/commitments", params={"mine": True}, headers=AUTH).json()[0]
    assert c["jira_key"] == "OPS-101"


def test_jira_create_issue_request_shape():
    seen = {}

    def handler(request: httpx.Request):
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        seen["auth"] = request.headers["authorization"]
        return httpx.Response(201, json={"key": "OPS-7"})

    cfg = IntegrationConfig(
        jira_base_url="https://corp.atlassian.net",
        jira_email="a@corp.com",
        jira_api_token="tok",
        jira_project_key="OPS",
    )
    key = create_issue(
        cfg,
        {"summary": "Do it", "description": "line 1\nline 2", "due_date": "2026-10-23"},
        http=httpx.Client(transport=httpx.MockTransport(handler)),
    )
    assert key == "OPS-7" and seen["url"].endswith("/rest/api/3/issue") and seen["auth"].startswith("Basic ")
    f = seen["body"]["fields"]
    assert f["project"] == {"key": "OPS"} and f["duedate"] == "2026-10-23"
    assert len(f["description"]["content"]) == 2 and f["description"]["type"] == "doc"


def test_calendar_parsing_and_prepare(client, monkeypatch):
    now = datetime.now(UTC)
    events = parse_ics(_ics(now), now - timedelta(hours=1), now + timedelta(days=7))
    standups = [e for e in events if e.title == "Daily standup"]
    assert len(standups) == 3 and len({e.key for e in standups}) == 3  # each occurrence is its own meeting
    assert standups[0].meeting_url.startswith("https://teams.microsoft.com/")
    assert "Priya Rao <priya@corp.com>" in standups[0].attendees
    acme = next(e for e in events if e.title == "Acme renewal call")
    assert acme.meeting_url == "https://zoom.us/j/98765" and acme.links == ["https://docs.example.com/acme"]
    assert not any(e.title == "Cancelled thing" for e in events)

    from app.api import integrations

    assert client.get("/api/calendar/events", headers=AUTH).json() == {"configured": False, "events": []}
    client.put("/api/integrations", json={"calendar_ics_url": "webcal://cal.example.com/me.ics"}, headers=AUTH)
    monkeypatch.setattr(
        integrations, "fetch_events", lambda url, days=7: parse_ics(_ics(now), now, now + timedelta(days=days))
    )
    cal = client.get("/api/calendar/events", headers=AUTH).json()
    by_title = {e["title"]: e for e in cal["events"]}
    assert by_title["Daily standup"]["profile"] == "standup"
    assert by_title["Acme renewal call"]["profile"] == "client_call"
    r = client.post("/api/calendar/prepare", json={"key": by_title["Acme renewal call"]["key"]}, headers=AUTH).json()
    m = client.get(f"/api/meetings/{r['meeting_id']}", headers=AUTH).json()
    assert m["profile"] == "client_call" and m["profile_source"] == "auto" and m["consent_state"] == "pending"
    assert r["brief"]["attendees"][0]["email"] == "dana@acme.com"
    again = client.get("/api/calendar/events", headers=AUTH).json()
    assert next(e for e in again["events"] if e["title"] == "Acme renewal call")["meeting_id"] == r["meeting_id"]


def test_rollup_digest_and_blocker_radar(client):
    text_meeting(
        client,
        "Standup",
        [("Priya", "I'm blocked on firewall approval from the network team."), ("Sai", "I'll send the runbook link.")],
        days_ago=4,
    )
    text_meeting(
        client,
        "Standup",
        [("Priya", "Still blocked on the firewall change."), ("Lee", "I'm blocked on the network team for the VPN.")],
        days_ago=2,
    )
    text_meeting(client, "Standup", [("Sai", "Yesterday I sent the runbook link.")], days_ago=1)
    since = (datetime.now(UTC) - timedelta(days=6)).date().isoformat()
    r = client.get("/api/rollup", params={"since": since}, headers=AUTH).json()
    people = {p["name"]: p for p in r["people"]}
    assert len(r["meetings"]) == 3 and people["Sai"]["done"] and people["Priya"]["blockers"]
    assert r["totals"]["done"] >= 1 and r["timesheet"]["by_profile"]["standup"] > 0
    md = client.get("/api/rollup", params={"since": since, "format": "md"}, headers=AUTH).text
    assert md.startswith("# Rollup") and "Blocker:" in md

    radar = client.get("/api/blocker-radar", headers=AUTH).json()
    assert radar and radar[0]["standups"] == 2 and set(radar[0]["people"]) >= {"Priya"}
    assert "standups since" in radar[0]["nudge"]

    client.patch("/api/me", json={"watched_keywords": ["cutover"]}, headers=AUTH)
    d = text_meeting(
        client,
        "Planning",
        [
            ("Priya", "Sai owns the DNS change."),
            ("Lee", "Lunch was great."),
            ("Priya", "The cutover moves to Thursday."),
            ("Lee", "Sai will send the runbook draft."),
        ],
        profile="planning",
    )
    dig = client.get(f"/api/meetings/{d['id']}/digest", headers=AUTH).json()
    texts = [h["text"] for h in dig["mentions"]]
    assert "Lunch was great." not in texts and "Sai owns the DNS change." in texts
    assert any("cutover" in w for h in dig["mentions"] for w in h["why"])
    assert dig["nothing_for_you"] is False
