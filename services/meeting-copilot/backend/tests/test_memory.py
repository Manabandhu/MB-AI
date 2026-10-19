"""Phase 4: meeting-type profiles, entities, decisions, commitments and filter-first retrieval."""

from datetime import UTC, date, datetime

from app.db import session_scope
from app.grounding import ungrounded
from app.pipeline.memory import resolve_due, similarity
from app.pipeline.profiles import detect_profile
from app.retrieval import parse_filters

from .conftest import AUTH
from .helpers import text_meeting


def test_profile_detection():
    assert detect_profile("Payments incident bridge")[0] == "incident"
    assert detect_profile("Weekly 1:1 Sai / Priya")[0] == "one_on_one"
    assert detect_profile("Acme QBR")[0] == "client_call"
    assert detect_profile("Daily standup")[0] == "standup"
    assert detect_profile("Q3 architecture design review")[0] == "planning"
    assert detect_profile("Catch up", ["Priya"])[0] == "one_on_one"
    assert detect_profile("Thursday", ["Priya", "Sam", "Lee"]) == ("general", 0.0)
    assert detect_profile("Thursday", [], opening="ok let's start the standup, yesterday I")[0] == "standup"


def test_auto_profile_at_creation_and_after_the_first_minutes(client):
    r = client.post("/api/meetings", json={"title": "Sev1 outage bridge", "profile": "auto"}, headers=AUTH).json()
    assert r["profile"] == "incident" and r["profile_source"] == "auto"
    d = text_meeting(client, "Thursday sync", [("Sai", "Let's do the standup. Yesterday I fixed the VPN.")],
                     profile="auto")  # fmt: skip
    assert d["profile"] == "standup" and d["summary"]["people"]
    # A user override sticks.
    r = client.patch(f"/api/meetings/{d['id']}", json={"profile": "general"}, headers=AUTH).json()
    assert r["profile_source"] == "user"


def test_profile_fields_and_custom_profiles(client):
    d = text_meeting(client, "DB outage", [("Priya", "Checkout errors started at 9:05."), ("Sai", "I'll fail over.")],
                     profile="incident")  # fmt: skip
    fields = d["summary"]["fields"]
    assert set(fields) == {"timeline", "impact", "hypotheses"}
    assert [f["key"] for f in d["summary"]["fields_meta"]] == ["timeline", "impact", "hypotheses"]

    body = {
        "key": "retro", "label": "Retro", "instructions": "A sprint retrospective. Capture what went well and not.",
        "fields": [{"key": "went_well", "label": "Went well", "hint": "positives"},
                   {"key": "summary_note", "label": "Note", "type": "text"}],
        "keywords": ["retro", "retrospective"],
    }  # fmt: skip
    assert client.post("/api/profiles/custom", json=body, headers=AUTH).status_code == 201
    assert client.post("/api/profiles/custom", json=body | {"key": "standup"}, headers=AUTH).status_code == 409
    keys = [p["key"] for p in client.get("/api/config", headers=AUTH).json()["profiles"]]
    assert "retro" in keys and "incident" in keys and len(keys) == 10
    r = client.post("/api/meetings", json={"title": "Sprint 42 retro", "profile": "auto"}, headers=AUTH).json()
    assert r["profile"] == "retro"
    d = text_meeting(client, "Sprint 42 retro", [("Sam", "The deploy pipeline was much faster.")], profile="retro")
    assert d["summary"]["fields"]["went_well"] == ["The deploy pipeline was much faster."]
    assert isinstance(d["summary"]["fields"]["summary_note"], str)
    assert client.delete("/api/profiles/custom/retro", headers=AUTH).status_code == 204
    d = client.get(f"/api/meetings/{d['id']}", headers=AUTH).json()
    assert d["profile"] == "general" and d["summary"]["fields_meta"][0]["label"] == "Went well"


def test_due_dates_and_similarity():
    monday = date(2026, 10, 19)
    assert resolve_due("Wednesday", monday) == date(2026, 10, 21)
    assert resolve_due("by Monday", monday) == date(2026, 10, 26)
    assert resolve_due("tomorrow", monday) == date(2026, 10, 20)
    assert resolve_due("end of week", monday) == date(2026, 10, 23)
    assert resolve_due("Nov 3", monday) == date(2026, 11, 3)
    assert resolve_due("2026-12-01", monday) == date(2026, 12, 1)
    assert resolve_due("soon", monday) is None
    assert similarity("I'll send the runbook link", "sent the runbook links") >= 0.5
    assert similarity("I'll send the runbook link", "fix the VPN tunnel") == 0


def test_commitments_are_tracked_across_meetings(client):
    d1 = text_meeting(client, "Standup", [("Sai", "Today I'll send the runbook link to Priya by Wednesday."),
                                          ("Priya", "I'll review the Terraform module.")], days_ago=9)  # fmt: skip
    open_ = client.get("/api/commitments", headers=AUTH).json()
    assert {c["owner"] for c in open_} == {"Sai", "Priya"}
    mine = client.get("/api/commitments", params={"mine": True}, headers=AUTH).json()
    assert len(mine) == 1 and mine[0]["due"] == "Wednesday" and mine[0]["due_date"]
    assert mine[0]["mentions"][0]["meeting_id"] == d1["id"] and mine[0]["mentions"][0]["kind"] == "made"

    # A week later it comes up again, still not done: same commitment, now stuck.
    text_meeting(client, "Standup", [("Sai", "Today I'll send the runbook link, sorry.")], days_ago=1)
    mine = client.get("/api/commitments", params={"mine": True}, headers=AUTH).json()
    assert len(mine) == 1 and mine[0]["mention_count"] == 2 and mine[0]["stuck"]
    assert [m["kind"] for m in mine[0]["mentions"]] == ["made", "progress"]
    assert client.get("/api/commitments", params={"status": "stuck"}, headers=AUTH).json()[0]["id"] == mine[0]["id"]
    assert client.get("/api/commitments", params={"status": "overdue"}, headers=AUTH).json()  # Wednesday passed

    # Next standup: "yesterday I sent it" closes it, and the original action item is ticked.
    d3 = text_meeting(client, "Standup", [("Sai", "Yesterday I sent the runbook link to Priya.")])
    c = client.get("/api/commitments", params={"status": "done"}, headers=AUTH).json()
    assert len(c) == 1 and c[0]["id"] == mine[0]["id"] and c[0]["mentions"][-1]["kind"] == "done"
    items = client.get(f"/api/meetings/{d1['id']}", headers=AUTH).json()["action_items"]
    assert next(a for a in items if a["owner"] == "Sai")["done"] is True

    # Re-summarizing doesn't double count; deleting the closing meeting reopens it.
    from app.worker import build_providers, run_once

    client.post(f"/api/meetings/{d3['id']}/reprocess", json={"stage": "summarize"}, headers=AUTH)
    assert run_once(build_providers())
    assert len(client.get("/api/commitments", params={"status": "done"}, headers=AUTH).json()) == 1
    client.delete(f"/api/meetings/{d3['id']}", headers=AUTH)
    reopened = client.get("/api/commitments", params={"mine": True}, headers=AUTH).json()
    assert len(reopened) == 1 and reopened[0]["status"] == "open"

    # Ticking an action item closes the commitment; reopening the commitment unticks it.
    priya_item = next(a for a in client.get(f"/api/meetings/{d1['id']}", headers=AUTH).json()["action_items"]
                      if a["owner"] == "Priya")  # fmt: skip
    client.patch(f"/api/action-items/{priya_item['id']}", json={"done": True}, headers=AUTH)
    done = client.get("/api/commitments", params={"status": "done", "owner": "priya"}, headers=AUTH).json()
    assert len(done) == 1
    client.patch(f"/api/commitments/{done[0]['id']}", json={"status": "open"}, headers=AUTH)
    item = next(a for a in client.get(f"/api/meetings/{d1['id']}", headers=AUTH).json()["action_items"]
                if a["id"] == priya_item["id"])  # fmt: skip
    assert item["done"] is False


def test_decisions_entities_and_glossary(client):
    client.post("/api/glossary", json={"term": "Kafka", "kind": "system", "definition": "Our event bus."}, headers=AUTH)
    assert client.post("/api/glossary", json={"term": "kafka"}, headers=AUTH).status_code == 409
    d = text_meeting(
        client, "Planning",
        [("Priya", "Let's decide to move the cutover to Thursday."), ("Sai", "Kafka lag is fine on the VPN side.")],
        profile="planning",
    )  # fmt: skip
    decisions = client.get("/api/decisions", params={"q": "cutover"}, headers=AUTH).json()
    assert decisions[0]["owner"] == "Priya" and decisions[0]["meeting_id"] == d["id"] and decisions[0]["at"] == 0
    ents = {e["name"]: e for e in client.get("/api/entities", headers=AUTH).json()}
    assert {"cutover", "Kafka", "VPN"} <= set(ents)
    assert ents["Kafka"]["kind"] == "system" and ents["Kafka"]["meetings"] == 1
    detail = client.get(f"/api/entities/{ents['cutover']['id']}", headers=AUTH).json()
    assert detail["recent_meetings"][0]["meeting_id"] == d["id"] and detail["decisions"]
    merged = client.post(
        "/api/entities/merge", json={"from_id": ents["VPN"]["id"], "into_id": ents["Kafka"]["id"]}, headers=AUTH
    ).json()
    assert "VPN" in merged["aliases"]
    # The glossary and entities feed STT as custom vocabulary.
    from app.pipeline.process import workspace_vocabulary

    with session_scope() as s:
        from app.db import Scope, set_scope
        from app.models import Meeting

        m = s.get(Meeting, d["id"])
        set_scope(s, Scope(m.workspace_id, m.user_id))
        s.commit()
        vocab = workspace_vocabulary(s)
    assert "Kafka" in vocab and "cutover" in vocab and "Priya" in vocab


def test_filter_first_retrieval(client):
    for i, days in enumerate([30, 20, 10, 2]):
        text_meeting(client, f"Acme call {i}", [("Dana", f"I will deliver {i + 10} Acme licenses by Friday."),
                                                ("Sai", "Thanks.")], profile="client_call", days_ago=days,
                     attendees=["Dana"])  # fmt: skip
    text_meeting(client, "Standup", [("Sai", "Acme will deliver 99 licenses, I heard.")], days_ago=1)
    with session_scope() as s:
        from app.db import Scope, set_scope
        from app.models import Meeting

        ws = s.query(Meeting).first()
        set_scope(s, Scope(ws.workspace_id, ws.user_id))
        s.commit()
        f = parse_filters(s, "What has Dana promised across the last three calls?", owner_name="Sai")
        assert f.profiles == [] and f.last_n == 3 and f.person_ids
        f = parse_filters(s, "what did the vendor promise in the last three calls?", owner_name="Sai")
        assert f.profiles == ["client_call", "phone_call"] and f.last_n == 3
        now = datetime(2026, 10, 21, 12, tzinfo=UTC)  # a Wednesday
        lw = parse_filters(s, "blockers last week", now=now)
        assert lw.since.date() == date(2026, 10, 12) and lw.until.date() == date(2026, 10, 19)

    r = client.post("/api/chat", json={"question": "What has the vendor promised across the last three calls?"},
                    headers=AUTH).json()  # fmt: skip
    titles = {s["meeting_title"] for s in r["sources"] if s["kind"] == "transcript"}
    assert titles == {"Acme call 1", "Acme call 2", "Acme call 3"}  # not call 0, not the standup
    assert any(s["kind"] == "commitment" for s in r["sources"])
    assert r["grounded"] is True and r["confidence"] > 0
    assert [s["n"] for s in r["sources"]] == list(range(1, len(r["sources"]) + 1))


def test_grounding_checks_specifics():
    srcs = ["Priya: the cutover moves to Thursday, 3 hosts left"]
    assert ungrounded("The cutover moves to Thursday [S1].", srcs) == []
    assert ungrounded("Priya said 3 hosts are left [S1].", srcs) == []
    assert ungrounded("Daniel moved it to Friday with 12 hosts.", srcs) == ["12", "Daniel", "friday"]


def test_documents_are_searchable_sources(client):
    r = client.post(
        "/api/documents",
        json={"title": "Checkout outage runbook", "kind": "runbook", "text": "Fail over the checkout database."},
        headers=AUTH,
    )
    assert r.status_code == 201 and r.json()["indexed"]
    from app.providers import get_embedder
    from app.retrieval import document_sources

    with session_scope() as s:
        from app.db import Scope, set_scope
        from app.models import Document

        doc = s.query(Document).first()
        set_scope(s, Scope(doc.workspace_id, doc.user_id))
        s.commit()
        hits = document_sources(s, get_embedder(), "checkout database outage", "runbook")
    assert hits and hits[0].meeting_title == "Checkout outage runbook"
    assert client.get("/api/documents", params={"kind": "runbook"}, headers=AUTH).json()[0]["excerpt"]
