"""Phase 3: triggers, grounded answer cards, the live gateway, briefs and the standup draft."""

from datetime import UTC, datetime

import numpy as np
import pytest
from starlette.websockets import WebSocketDisconnect

from app.integrations.activity import Activity
from app.live.detector import TriggerDetector, is_question
from app.worker import build_providers, run_once

from .conftest import AUTH
from .helpers import text_meeting

SR = 16000


def _pcm(seconds: float, left: list[tuple[float, float, float]], right: list[tuple[float, float, float]]) -> bytes:
    data = np.zeros((int(SR * seconds), 2), dtype=np.float32)
    for ch, regions in enumerate((left, right)):
        for a, b, f in regions:
            t = np.arange(int((b - a) * SR)) / SR
            data[int(a * SR) : int(a * SR) + len(t), ch] = 0.3 * np.sin(2 * np.pi * f * t)
    return (data * 32767).astype("<i2").tobytes()


def _recv_until(ws, kind: str, pred=lambda e: True, limit: int = 300) -> tuple[dict, list[dict]]:
    seen = []
    for _ in range(limit):
        e = ws.receive_json()
        seen.append(e)
        if e["type"] == kind and pred(e):
            return e, seen
    raise AssertionError(f"no {kind} event; saw {[x['type'] for x in seen]}")


def _history(client):
    return text_meeting(
        client,
        "Standup",
        [("Priya", "I'm blocked on firewall approval from the network team."), ("Sai", "I'll chase the network team.")],
        days_ago=1,
    )


def _new_meeting(client, **kw):
    body = {"title": "Platform sync", "profile": "general", "consent_confirmed": True, "attendees": ["Priya"]} | kw
    return client.post("/api/meetings", json=body, headers=AUTH).json()


# ------------------------------------------------------------------------------------- detector


def test_detector_rules():
    commitments = [{"id": 7, "owner": "Sai", "text": "send the runbook link", "due": "Wednesday", "mine": True}]
    d = TriggerDetector(
        owner_names=["Sai", "SK"], keywords=["Kafka"], terms={"sla": "Service level."}, commitments=commitments
    )
    assert is_question("When is the cutover?") and is_question("can you share it") and not is_question("ok thanks")
    assert d.final("Sai", True, "When is the cutover?", 1.0) == []  # your own questions don't raise cards
    t = d.final("Priya", False, "Sai, when is the cutover?", 2.0)
    assert [x.kind for x in t] == ["name"] and t[0].question == "Sai, when is the cutover?"
    assert d.final("Priya", False, "Sai, any update?", 5.0) == []  # cooldown
    # A question after you spoke, aimed at "you": the turn passes to you.
    d2 = TriggerDetector(owner_names=["Sai"])
    d2.final("Sai", True, "I finished the load test.", 10.0)
    assert [x.kind for x in d2.final("Lee", False, "What did you find?", 12.0)] == ["question"]
    assert d2.final("Lee", False, "What did Mark find?", 50.0) == []  # not aimed at you
    # Named a moment ago, asked now: still yours.
    d3 = TriggerDetector(owner_names=["Sai"])
    assert d3.final("Lee", False, "Sai might know this one.", 1.0)[0].prefetch  # retrieval starts, no card yet
    assert [x.kind for x in d3.final("Kim", False, "What's the rollback plan?", 6.0)][0] in ("name", "question")
    # Keywords, explain-a-term, commitments, and partial-transcript prefetch.
    assert [x.kind for x in d.final("Lee", False, "Kafka lag is up again", 40.0)] == ["keyword"]
    assert d.final("Lee", False, "Kafka lag is still up", 80.0) == []
    e = d.final("Lee", False, "What does SLA mean?", 100.0)
    assert e[0].kind == "explain" and e[0].term == "sla"
    c = d.final("Lee", False, "Did anyone send the runbook link?", 130.0)
    assert c[0].kind == "commitment" and c[0].commitment["id"] == 7
    assert d.partial("Lee", False, "SK quick question about", 200.0).prefetch


# ---------------------------------------------------------------------------------------- cards


def test_rest_ask_grounded_card_and_fallback(client, monkeypatch):
    _history(client)
    m = _new_meeting(client)
    card = client.post(
        f"/api/meetings/{m['id']}/live/ask", json={"question": "Who is blocked on firewall approval?"}, headers=AUTH
    ).json()
    assert card["grounded"] and "firewall" in card["answer"].lower()
    assert card["sources"] and card["sources"][0]["meeting_title"] == "Standup" and card["facts"]
    assert {"retrieval", "first_token", "total"} <= set(card["timings_ms"])
    assert card["timings_ms"]["total"] < 3000

    # Nothing relevant in history: the card says so instead of guessing.
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "live_answer_min_score", 0.99)
    card = client.post(
        f"/api/meetings/{m['id']}/live/ask", json={"question": "What is the Q4 budget?"}, headers=AUTH
    ).json()
    assert card["answer"] == "Not in your history — say you'll follow up." and not card["grounded"]
    monkeypatch.undo()

    # A model that invents a number gets replaced by the fallback.
    from app.providers import fakes

    orig = fakes.FakeLLM.complete

    def inventive(self, system, messages, **kw):
        if "TASK: live-answer" in system:
            return "Priya has been blocked for 17 days [S1]."
        return orig(self, system, messages, **kw)

    monkeypatch.setattr(fakes.FakeLLM, "complete", inventive)
    card = client.post(
        f"/api/meetings/{m['id']}/live/ask", json={"question": "Who is blocked on firewall approval?"}, headers=AUTH
    ).json()
    assert not card["grounded"] and card["answer"].startswith("Not in your history")

    # Feedback feeds the live metrics.
    client.post(f"/api/live/cards/{card['id']}/feedback", json={"value": -1}, headers=AUTH)
    cards = client.get(f"/api/meetings/{m['id']}/live/cards", headers=AUTH).json()
    assert len(cards) == 3 and cards[-1]["feedback"] == -1
    live = client.get("/api/metrics/live", headers=AUTH).json()
    assert live["cards"] == 3 and live["rated"] == 1 and live["useful"] == 0 and live["not_in_history"] == 2


# ------------------------------------------------------------------------------------ WebSocket


def test_live_capture_end_to_end(client):
    _history(client)
    client.post(
        "/api/glossary", json={"term": "SLA", "definition": "Service level agreement: 99.9% uptime."}, headers=AUTH
    )
    m = _new_meeting(client)
    with client.websocket_connect(f"/api/live/{m['id']}?token=test-token&role=capture&channels=2") as ws:
        notice, _ = _recv_until(ws, "notice")
        assert "recorded" in notice["text"]

        # Stereo audio: you on the left at 300 Hz, the meeting on the right at 500 Hz.
        audio = _pcm(4.0, [(0.3, 1.5, 300)], [(2.0, 3.2, 500)])
        for i in range(0, len(audio), 6400):
            ws.send_bytes(audio[i : i + 6400])
        mine, _ = _recv_until(ws, "final", lambda e: e["line"]["is_owner"])
        theirs, _ = _recv_until(ws, "final", lambda e: not e["line"]["is_owner"])
        assert mine["line"]["speaker"] == "Sai" and theirs["line"]["speaker"] == "Speaker A"

        # A platform caption aimed at you raises a grounded card, streamed then completed.
        ws.send_json({"type": "caption", "speaker": "Priya", "text": "Sai, who is blocked on the firewall approval?"})
        card, seen = _recv_until(ws, "card", lambda e: e["card"]["trigger"] == "name")
        assert card["card"]["grounded"] and card["card"]["sources"][0]["meeting_title"] == "Standup"
        assert any(e["type"] == "card_delta" for e in seen) and any(e["type"] == "card_start" for e in seen)

        # Explain a glossary term; it's answered from the glossary.
        ws.send_json({"type": "caption", "speaker": "Lee", "text": "Sorry, what does SLA mean?"})
        explain, _ = _recv_until(ws, "card", lambda e: e["card"]["kind"] == "explain")
        assert "99.9%" in explain["card"]["answer"]

        # Translation of new lines.
        ws.send_json({"type": "translate", "to": "es"})
        ws.send_json({"type": "caption", "speaker": "Lee", "text": "The deploy went fine."})
        tr, _ = _recv_until(ws, "translation")
        assert tr["text"].startswith("[es]")

        # Off the record: audio during the pause is not transcribed and leaves a gap.
        ws.send_json({"type": "pause"})
        state, _ = _recv_until(ws, "state", lambda e: e["off_record"])
        ws.send_bytes(_pcm(1.0, [], [(0.1, 0.9, 700)]))
        ws.send_json({"type": "caption", "speaker": "Lee", "text": "this should not be kept"})
        ws.send_json({"type": "resume"})
        state, seen = _recv_until(ws, "state", lambda e: not e["off_record"])
        assert state["gaps"] and state["gaps"][0][1] - state["gaps"][0][0] == pytest.approx(1.0, abs=0.1)
        assert not any(e["type"] == "final" and "not be kept" in e["line"]["text"] for e in seen)

        # Feedback over the socket.
        ws.send_json({"type": "feedback", "card_id": card["card"]["id"], "value": 1})
        ws.send_json({"type": "stop"})
        stopped, _ = _recv_until(ws, "stopped")
        assert stopped["status"] == "queued"

    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "queued" and d["source"] == "live" and d["off_record"]
    assert any(c["method"] == "live_notice" for c in d["consent_log"])
    assert run_once(build_providers())  # the accurate post-meeting pass
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "done" and d["channel_layout"] == "mic_system" and d["segments"]
    assert {s["label"] for s in d["speakers"]} >= {"me"}
    cards = client.get(f"/api/meetings/{m['id']}/live/cards", headers=AUTH).json()
    assert any(c["feedback"] == 1 for c in cards)
    md = client.get(f"/api/meetings/{m['id']}/export", headers=AUTH).text
    assert "off the record" in md


def test_live_refuses_without_consent_or_token(client):
    m = _new_meeting(client, consent_confirmed=False)
    with client.websocket_connect(f"/api/live/{m['id']}?token=test-token") as ws:
        err = ws.receive_json()
        assert err["type"] == "error" and "consent" in err["text"]
        with pytest.raises(WebSocketDisconnect) as e:
            ws.receive_json()
        assert e.value.code == 4403
    with pytest.raises(WebSocketDisconnect) as e, client.websocket_connect(f"/api/live/{m['id']}?token=nope") as ws:
        ws.receive_json()
    assert e.value.code == 4401


def test_viewers_get_replayed_events_and_caption_only_sessions(client):
    _history(client)
    m = _new_meeting(client, title="Teams call", attendees=["Priya", "Lee"])
    r = client.post(
        f"/api/meetings/{m['id']}/live/captions",
        json={"speaker": "Priya", "text": "Morning everyone.", "start": 1.0, "end": 2.0},
        headers=AUTH,
    )
    assert r.status_code == 202
    client.post(
        f"/api/meetings/{m['id']}/live/captions",
        json={"speaker": "Sai", "text": "Morning! Quick update on the firewall.", "start": 3.0, "end": 5.0},
        headers=AUTH,
    )
    with client.websocket_connect(f"/api/live/{m['id']}?token=test-token&role=view") as viewer:
        first, seen = _recv_until(viewer, "final", lambda e: e["line"]["speaker"] == "Sai")
        assert seen[0]["type"] == "notice" and first["line"]["is_owner"]
    assert client.post(f"/api/meetings/{m['id']}/live/stop", headers=AUTH).json()["status"] == "queued"
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "done"
    assert {s["display_name"] for s in d["speakers"]} == {"Sai", "Priya"}
    assert client.post(f"/api/meetings/{m['id']}/live/stop", headers=AUTH).status_code == 409


# ------------------------------------------------------------------------- brief and standup


def test_brief_for_a_client_call(client):
    text_meeting(
        client,
        "Acme call",
        [("Dana", "I will send the signed order form by Friday."), ("Sai", "Great.")],
        profile="client_call",
        attendees=["Dana"],
        days_ago=3,
    )
    m = _new_meeting(
        client,
        title="Acme follow-up",
        profile="client_call",
        attendees=["Dana <dana@acme.com>"],
        links=[{"title": "Contract", "url": "https://docs.example.com/acme"}],
    )
    brief = client.get(f"/api/meetings/{m['id']}/brief", headers=AUTH).json()
    dana = brief["attendees"][0]
    assert dana["name"] == "Dana" and dana["email"] == "dana@acme.com" and dana["meetings_together"] == 1
    assert dana["open_commitments"][0]["text"].startswith("I will send the signed order form")
    assert brief["last_meeting_with_them"]["title"] == "Acme call"
    assert any(f["kind"] == "promise" for f in brief["focus"])
    assert brief["linked_docs"][0]["url"].startswith("https://docs")


def test_standup_draft_and_rehearse(client, monkeypatch):
    text_meeting(
        client,
        "Standup",
        [("Sai", "I'll finish the VPN cutover plan."), ("Sai", "I'm blocked on the firewall change.")],
        days_ago=1,
    )
    from app.services import standup

    activity = [
        Activity("jira", "issue", "NET-42 Firewall rule for VPN (In Review)", None, datetime.now(UTC)),
        Activity("github", "pr", "infra#88 Add subnets (merged)", None, datetime.now(UTC)),
    ]
    monkeypatch.setattr(standup, "collect_activity", lambda cfg, since: activity)
    draft = client.post("/api/standup/draft", headers=AUTH).json()
    assert "NET-42 Firewall rule for VPN (In Review)" in draft["yesterday"]
    assert any("VPN cutover plan" in t for t in draft["today"])
    assert any("firewall" in b.lower() for b in draft["blockers"])
    assert draft["text"].startswith("Yesterday:") and draft["inputs"]["last_standup"]

    long_update = " ".join(["Yesterday I worked on the VPN tunnel config and the change request."] * 20)
    r = client.post("/api/standup/rehearse", json={"text": long_update}, headers=AUTH).json()
    assert r["words_after"] <= 130 < r["words_before"] and r["under_a_minute"]

    # A standup's live session opens with your pre-filled update.
    m = _new_meeting(client, title="Daily standup", profile="standup")
    with client.websocket_connect(f"/api/live/{m['id']}?token=test-token&channels=1") as ws:
        upd, seen = _recv_until(ws, "card", lambda e: e["card"]["kind"] == "update")
        assert "NET-42" in upd["card"]["answer"]
        brief = next(e for e in seen if e["type"] == "brief")  # sent just before the update card
        assert brief["brief"]["profile"]["key"] == "standup"
        ws.send_json({"type": "stop"})
        stopped, _ = _recv_until(ws, "stopped")
        assert stopped["status"] == "created"  # nothing was said
