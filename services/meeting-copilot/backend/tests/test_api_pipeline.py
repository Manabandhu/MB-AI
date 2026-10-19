"""End to end: create a meeting, upload stereo audio, run the worker, then use every API on the result."""

from datetime import UTC, datetime, timedelta

from app.models import Meeting
from app.pipeline.process import purge_expired_audio
from app.storage import get_storage
from app.worker import build_providers, run_once

from .conftest import AUTH


def _stereo_standup(tmp_audio):
    # Left = your mic: two turns at 300 Hz. Right = the call: one person at 500 Hz, another at 900 Hz.
    return tmp_audio(
        "standup.flac",
        14.0,
        [
            [(0.5, 2.5, 300), (11.0, 12.5, 300)],
            [(3.0, 5.0, 500), (6.0, 8.0, 900), (8.5, 10.0, 500)],
        ],
    )


def _create(client, **kw):
    body = {
        "title": "Daily standup",
        "profile": "standup",
        "channel_layout": "mic_system",
        "consent_confirmed": True,
    } | kw
    r = client.post("/api/meetings", json=body, headers=AUTH)
    assert r.status_code == 201, r.text
    return r.json()


def _upload(client, meeting_id, path):
    with open(path, "rb") as fh:
        r = client.put(f"/api/meetings/{meeting_id}/audio", files={"file": (path.name, fh, "audio/flac")}, headers=AUTH)
    assert r.status_code == 200, r.text
    return r.json()


def test_requires_token(client):
    assert client.get("/api/meetings").status_code == 401
    assert client.get("/api/meetings", headers={"Authorization": "Bearer wrong"}).status_code == 401
    assert client.get("/api/health").status_code == 200


def test_full_pipeline_and_follow_up_actions(client, tmp_audio):
    meeting = _create(client)
    assert meeting["status"] == "created"

    uploaded = _upload(client, meeting["id"], _stereo_standup(tmp_audio))
    assert uploaded["status"] == "queued"

    providers = build_providers()
    assert run_once(providers) is True
    assert run_once(providers) is False  # queue drained

    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert d["status"] == "done", d["error"]
    assert 13.5 < d["duration_s"] < 14.5
    assert d["has_audio"] is True

    # Mic channel became the owner; the two voices on the call became S1 and S2.
    labels = {s["label"]: s for s in d["speakers"]}
    assert set(labels) == {"me", "S1", "S2"}
    assert labels["me"]["display_name"] == "Sai" and labels["me"]["is_owner"]
    order = [s["speaker_label"] for s in d["segments"]]
    assert order == ["me", "S1", "S2", "S1", "me"]

    assert d["summary"]["people"], "standup summary lists people"
    assert {p["name"] for p in d["summary"]["people"]} == {"Sai", "Speaker 1", "Speaker 2"}

    # Rename a speaker, regenerate the summary only (no re-transcription), and see the new name.
    r = client.patch(f"/api/meetings/{meeting['id']}/speakers/S1", json={"display_name": "Priya"}, headers=AUTH)
    assert r.status_code == 200 and r.json()["display_name"] == "Priya"
    r = client.post(f"/api/meetings/{meeting['id']}/reprocess", json={"stage": "summarize"}, headers=AUTH)
    assert r.json()["status"] == "queued"
    assert run_once(providers)
    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert "Priya" in {p["name"] for p in d["summary"]["people"]}

    # Merge S2 into S1 (diarization over-split one person).
    r = client.post(
        f"/api/meetings/{meeting['id']}/speakers/merge", json={"from_label": "S2", "into_label": "S1"}, headers=AUTH
    )
    assert r.status_code == 200
    assert {s["label"] for s in r.json()["speakers"]} == {"me", "S1"}

    # The list view shows the overview.
    items = client.get("/api/meetings", headers=AUTH).json()
    assert items[0]["id"] == meeting["id"] and items[0]["overview"]

    # Search and chat are grounded in the indexed transcript.
    hits = client.get("/api/search", params={"q": "firewall approval blocked"}, headers=AUTH).json()
    assert hits and "firewall" in hits[0]["text"].lower()
    chat = client.post("/api/chat", json={"question": "who is blocked on the firewall?"}, headers=AUTH).json()
    assert chat["sources"] and "[S" in chat["answer"]
    assert {s["kind"] for s in chat["sources"]} == {"transcript", "summary"}

    # The audio player gets a signed link that works without the bearer token, and only until it expires.
    url = client.get(f"/api/meetings/{meeting['id']}/audio-url", headers=AUTH).json()["url"]
    media = client.get(url)
    assert media.status_code == 200 and media.headers["content-type"] == "audio/mp4" and len(media.content) > 1000
    assert client.get(url.replace("sig=", "sig=0")).status_code == 403

    # Action items can be ticked off.
    actions = client.get("/api/action-items", headers=AUTH).json()
    if actions:
        r = client.patch(f"/api/action-items/{actions[0]['id']}", json={"done": True}, headers=AUTH)
        assert r.json()["done"] is True

    # Delete removes the meeting and its audio.
    storage = get_storage()
    playback = storage.local_path(f"{meeting['id']}/playback.m4a")
    assert playback is not None
    assert client.delete(f"/api/meetings/{meeting['id']}", headers=AUTH).status_code == 204
    assert not playback.exists()
    assert client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).status_code == 404


def test_mono_upload_is_diarized_without_an_owner(client, tmp_audio):
    meeting = _create(client, channel_layout="mono", profile="general", title="Room meeting")
    path = tmp_audio("room.wav", 8.0, [[(0.5, 2.0, 400), (3.0, 5.0, 800)]])
    _upload(client, meeting["id"], path)
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert d["status"] == "done"
    assert {s["label"] for s in d["speakers"]} == {"S1", "S2"}
    assert d["summary"]["people"] == []  # general profile


def test_silent_system_channel_is_skipped(client, tmp_audio):
    meeting = _create(client)
    path = tmp_audio("solo.flac", 5.0, [[(0.5, 3.0, 300)], []])
    _upload(client, meeting["id"], path)
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert [s["label"] for s in d["speakers"]] == ["me"]


def test_bad_uploads_are_rejected(client, tmp_path):
    meeting = _create(client)
    exe = tmp_path / "x.exe"
    exe.write_bytes(b"MZ")
    with open(exe, "rb") as fh:
        r = client.put(f"/api/meetings/{meeting['id']}/audio", files={"file": ("x.exe", fh)}, headers=AUTH)
    assert r.status_code == 415
    empty = tmp_path / "e.wav"
    empty.write_bytes(b"")
    with open(empty, "rb") as fh:
        r = client.put(f"/api/meetings/{meeting['id']}/audio", files={"file": ("e.wav", fh)}, headers=AUTH)
    assert r.status_code == 422


def test_corrupt_audio_fails_cleanly_and_can_be_retried(client, tmp_path, tmp_audio):
    meeting = _create(client)
    junk = tmp_path / "junk.wav"
    junk.write_bytes(b"this is not audio" * 100)
    _upload(client, meeting["id"], junk)
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert d["status"] == "failed" and d["error"]
    # A good upload replaces it and processes fine.
    _upload(client, meeting["id"], _stereo_standup(tmp_audio))
    assert run_once(build_providers())
    assert client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()["status"] == "done"


def test_cannot_change_a_meeting_while_it_is_queued(client, tmp_audio):
    meeting = _create(client)
    _upload(client, meeting["id"], _stereo_standup(tmp_audio))
    r = client.post(f"/api/meetings/{meeting['id']}/reprocess", json={"stage": "full"}, headers=AUTH)
    assert r.status_code == 409


def test_unknown_profile_rejected(client):
    r = client.post("/api/meetings", json={"title": "x", "profile": "nope"}, headers=AUTH)
    assert r.status_code == 422


def test_retention_removes_audio_but_keeps_text(client, tmp_audio, db):
    from app.db import session_scope

    meeting = _create(client, started_at=(datetime.now(UTC) - timedelta(days=40)).isoformat())
    _upload(client, meeting["id"], _stereo_standup(tmp_audio))
    assert run_once(build_providers())
    with session_scope() as session:
        assert purge_expired_audio(session, get_storage(), retention_days=30) == 1
        m = session.get(Meeting, meeting["id"])
        assert m.audio_key is None and m.audio_deleted_at is not None
    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert d["has_audio"] is False and d["segments"] and d["summary"]
    r = client.post(f"/api/meetings/{meeting['id']}/reprocess", json={"stage": "full"}, headers=AUTH)
    assert r.status_code == 409  # nothing left to re-transcribe
    r = client.post(f"/api/meetings/{meeting['id']}/reprocess", json={"stage": "summarize"}, headers=AUTH)
    assert r.status_code == 200


def test_reindex_rebuilds_search_without_touching_summaries(client, tmp_audio):
    from app.manage import reindex

    meeting = _create(client)
    _upload(client, meeting["id"], _stereo_standup(tmp_audio))
    providers = build_providers()
    assert run_once(providers)
    before = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()["summary"]

    llm_calls = len(providers.llm.calls)
    assert reindex() == 1
    assert client.get("/api/search", params={"q": "firewall"}, headers=AUTH).json() == []  # index emptied
    assert run_once(providers)
    assert len(providers.llm.calls) == llm_calls  # no new summary was generated
    d = client.get(f"/api/meetings/{meeting['id']}", headers=AUTH).json()
    assert d["status"] == "done" and d["summary"] == before
    assert client.get("/api/search", params={"q": "firewall"}, headers=AUTH).json()
