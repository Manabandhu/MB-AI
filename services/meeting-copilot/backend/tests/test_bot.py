"""Phase 4: the meeting bot. Captions drive live assist; the recording and platform names feed the batch pass."""

from app.auth import sign_value
from app.config import get_settings
from app.providers import get_bot
from app.providers.bot import platform_of
from app.worker import build_providers, run_once

from .conftest import AUTH
from .helpers import text_meeting


def _hook(mid: str) -> str:
    return f"/api/bot/webhook?mid={mid}&sig={sign_value('bot-webhook', mid)}"


def test_platform_links():
    assert platform_of("https://meet.google.com/abc-defg-hij") == ("google_meet", "abc-defg-hij")
    assert platform_of("https://us02web.zoom.us/j/812345678?pwd=x") == ("zoom", "812345678")
    assert platform_of("https://teams.microsoft.com/l/meetup-join/19%3ameeting_x")[0] == "teams"


def test_bot_end_to_end(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "public_base_url", "https://copilot.example.com")
    text_meeting(
        client, "Standup", [("Priya Rao", "I'm blocked on the firewall approval from the network team.")], days_ago=1
    )
    m = client.post("/api/meetings", json={"title": "Team sync", "profile": "general"}, headers=AUTH).json()
    url = "https://meet.google.com/abc-defg-hij"
    r = client.post(f"/api/meetings/{m['id']}/bot", json={"meeting_url": url}, headers=AUTH)
    assert r.status_code == 409  # consent first
    r = client.post(f"/api/meetings/{m['id']}/bot", json={"meeting_url": url, "consent_confirmed": True}, headers=AUTH)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["source"] == "bot" and d["consent_log"][-1]["method"] == "bot_notice"
    bot = get_bot()
    hook = bot.joined["fake-1"]
    assert hook.startswith("https://copilot.example.com/api/bot/webhook?mid=")

    # Bad signatures are refused.
    assert client.post(f"/api/bot/webhook?mid={m['id']}&sig=nope", json={}).status_code == 403

    # Live captions from the bot (Attendee's payload shape) start live assist with real names.
    def caption(speaker, text, ms):
        return {
            "bot_id": "fake-1",
            "trigger": "transcript.update",
            "data": {
                "speaker_name": speaker,
                "timestamp_ms": ms,
                "duration_ms": 2000,
                "transcription": {"transcript": text},
            },
        }

    assert client.post(_hook(m["id"]), json=caption("Dan Lee", "Morning all.", 1000)).status_code == 204
    with client.websocket_connect(f"/api/live/{m['id']}?token=test-token&role=view") as viewer:
        client.post(_hook(m["id"]), json=caption("Dan Lee", "Sai, who is blocked on the firewall approval?", 4000))
        for _ in range(200):
            e = viewer.receive_json()
            if e["type"] == "card":
                break
        assert e["card"]["grounded"] and e["card"]["sources"]
    assert client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()["status"] == "live"

    # The bot leaves: the worker fetches its recording and per-participant names.
    end = {"bot_id": "fake-1", "trigger": "bot.state_change", "data": {"new_state": "ended"}}
    assert client.post(_hook(m["id"]), json=end).status_code == 204
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "queued"
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "done", d["error"]
    names = {s["display_name"]: s for s in d["speakers"]}
    assert set(names) == {"Priya Rao", "Dan Lee"}  # one pitch, two people: names came from the platform
    assert all(s["match_source"] == "platform" for s in d["speakers"])
    assert d["has_audio"]


def test_bot_leave_and_sync(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "public_base_url", "https://copilot.example.com")
    m = client.post("/api/meetings", json={"title": "Zoom call", "consent_confirmed": True}, headers=AUTH).json()
    client.post(f"/api/meetings/{m['id']}/bot", json={"meeting_url": "https://zoom.us/j/123456"}, headers=AUTH)
    assert client.delete(f"/api/meetings/{m['id']}/bot", headers=AUTH).json()["bot_status"] == "leaving"
    d = client.post(f"/api/meetings/{m['id']}/bot/sync", headers=AUTH).json()
    assert d["status"] == "queued"
    bad = client.post(f"/api/meetings/{m['id']}/bot", json={"meeting_url": "https://example.com/x"}, headers=AUTH)
    assert bad.status_code == 502
