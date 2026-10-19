"""Phase 2: opt-in voiceprints, automatic speaker labels, platform labels, corrections and accuracy."""

from app.pipeline.platform import parse_vtt
from app.worker import build_providers, run_once

from .conftest import AUTH


def _person(client, name, **kw):
    r = client.post("/api/people", json={"display_name": name} | kw, headers=AUTH)
    assert r.status_code == 201, r.text
    return r.json()


def _enroll(client, person_id, tmp_audio, freq, consent=True):
    files = []
    for i in range(3):
        path = tmp_audio(f"clip-{person_id[:4]}-{i}.wav", 4.0, [[(0.0, 4.0, freq)]])
        files.append(("clips", (path.name, open(path, "rb"), "audio/wav")))
    try:
        return client.post(
            f"/api/people/{person_id}/voiceprint", files=files, data={"consent": str(consent).lower()}, headers=AUTH
        )
    finally:
        for _n, (_name, fh, _t) in files:
            fh.close()


def _record(client, tmp_audio, regions, attendees=(), title="Room meeting", duration=10.0):
    r = client.post(
        "/api/meetings",
        json={
            "title": title,
            "profile": "general",
            "channel_layout": "mono",
            "consent_confirmed": True,
            "attendees": list(attendees),
        },  # fmt: skip
        headers=AUTH,
    )
    m = r.json()
    path = tmp_audio(f"{m['id'][:8]}.wav", duration, [regions])
    with open(path, "rb") as fh:
        assert (
            client.put(f"/api/meetings/{m['id']}/audio", files={"file": (path.name, fh)}, headers=AUTH).status_code
            == 200
        )
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    assert d["status"] == "done", d["error"]
    return d


def _by_name(d):
    return {s["display_name"]: s for s in d["speakers"]}


def test_voiceprints_need_consent_and_store_no_audio(client, tmp_audio, db):
    priya = _person(client, "Priya", email="priya@corp.com")
    r = _enroll(client, priya["id"], tmp_audio, 500, consent=False)
    assert r.status_code == 422 and "consent" in r.json()["detail"]
    r = _enroll(client, priya["id"], tmp_audio, 500)
    assert r.status_code == 200, r.text
    assert r.json()["has_voiceprint"] and r.json()["consent_at"] and r.json()["voiceprint_seconds"] == 12.0
    short = tmp_audio("short.wav", 1.0, [[(0.0, 1.0, 500)]])
    with open(short, "rb") as fh:
        r = client.post(
            f"/api/people/{priya['id']}/voiceprint", files=[("clips", ("s.wav", fh))], data={"consent": "true"},
            headers=AUTH,
        )  # fmt: skip
    assert r.status_code == 422
    from sqlalchemy import text

    with db.connect() as conn:  # only an embedding is stored; no audio columns or files exist for it
        cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='voiceprints'"))
        assert {c for (c,) in cols} == {
            "id", "person_id", "embedding", "model", "clips", "seconds", "created_at", "workspace_id", "user_id",
        }  # fmt: skip
    log = client.get("/api/audit", params={"action": "voiceprint_enroll"}, headers=AUTH).json()
    assert len(log) == 1


def test_enrolled_attendees_are_recognized_and_others_stay_numbered(client, tmp_audio):
    priya = _person(client, "Priya")
    assert _enroll(client, priya["id"], tmp_audio, 500).status_code == 200
    d = _record(client, tmp_audio, [(0.5, 2.5, 500), (3.0, 5.0, 900), (6.0, 8.0, 500)], attendees=["Priya", "Sam"])
    names = _by_name(d)
    assert names["Priya"]["match_source"] == "voiceprint" and names["Priya"]["match_score"] > 0.9
    assert names["Priya"]["person_id"] == priya["id"]
    assert any(n.startswith("Speaker") for n in names)  # the 900 Hz voice has no voiceprint
    # Transcript, summary input and exports use the recognized name.
    md = client.get(f"/api/meetings/{d['id']}/export", headers=AUTH).text
    assert "**Priya:**" in md

    # Only attendees are compared: with a different attendee list Priya isn't matched.
    d2 = _record(client, tmp_audio, [(0.5, 2.5, 500)], attendees=["Someone Else"])
    assert "Priya" not in _by_name(d2)

    # Deleting the voiceprint stops recognition and clears consent.
    r = client.delete(f"/api/people/{priya['id']}/voiceprint", headers=AUTH).json()
    assert r["has_voiceprint"] is False and r["consent_at"] is None
    d3 = _record(client, tmp_audio, [(0.5, 2.5, 500)], attendees=["Priya"])
    assert "Priya" not in _by_name(d3)

    people = {p["display_name"]: p for p in client.get("/api/people", headers=AUTH).json()}
    assert people["Priya"]["meetings"] == 1 and people["Sai"]["is_you"]
    assert "Sam" in people and "Someone Else" in people  # attendees join the directory


def test_tag_an_unknown_speaker_once(client, tmp_audio):
    d = _record(client, tmp_audio, [(0.5, 4.0, 700), (4.5, 6.0, 300)], attendees=["Arjun"])
    unknown = next(s for s in d["speakers"] if s["display_name"].startswith("Speaker") and s["label"] == "S1")
    arjun = next(p for p in client.get("/api/people", headers=AUTH).json() if p["display_name"] == "Arjun")
    url = f"/api/meetings/{d['id']}/speakers/{unknown['label']}/enroll"
    assert client.post(url, json={"person_id": arjun["id"]}, headers=AUTH).status_code == 422  # no consent
    r = client.post(url, json={"person_id": arjun["id"], "consent": True}, headers=AUTH)
    assert r.status_code == 200, r.text and r.json()["has_voiceprint"]
    d2 = _record(client, tmp_audio, [(0.5, 3.0, 700)], attendees=["Arjun"])
    assert _by_name(d2)["Arjun"]["match_source"] == "voiceprint"


def test_naming_a_speaker_links_the_people_directory(client, tmp_audio):
    d = _record(client, tmp_audio, [(0.5, 2.5, 400), (3.0, 5.0, 800)])
    r = client.patch(f"/api/meetings/{d['id']}/speakers/S1", json={"display_name": "Lena"}, headers=AUTH)
    assert r.status_code == 200 and r.json()["person_id"] and r.json()["match_source"] == "manual"
    lena = next(p for p in client.get("/api/people", headers=AUTH).json() if p["display_name"] == "Lena")
    assert lena["id"] == r.json()["person_id"]
    # Renaming the person renames every speaker linked to them.
    client.patch(f"/api/people/{lena['id']}", json={"display_name": "Lena M"}, headers=AUTH)
    d = client.get(f"/api/meetings/{d['id']}", headers=AUTH).json()
    assert "Lena M" in _by_name(d)


def test_corrections_drive_speaker_accuracy_and_threshold_advice(client, tmp_audio):
    priya = _person(client, "Priya")
    sam = _person(client, "Sam")
    _enroll(client, priya["id"], tmp_audio, 500)
    d = _record(client, tmp_audio, [(0.5, 2.0, 500), (2.5, 4.0, 900), (5.0, 6.5, 500), (7.0, 8.5, 900)],
                attendees=["Priya", "Sam"])  # fmt: skip
    m = client.get("/api/metrics/speakers", headers=AUTH).json()
    assert m["turns"] == 4 and m["accuracy"] == 1.0 and m["voiceprint_matches"] == 1

    # One line was actually the other person: the fix-speaker tap.
    seg = d["segments"][1]
    other = next(s["label"] for s in d["speakers"] if s["label"] != seg["speaker_label"])
    r = client.patch(f"/api/meetings/{d['id']}/segments/{seg['id']}", json={"speaker_label": other}, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["segments"][1]["speaker_label"] == other
    m = client.get("/api/metrics/speakers", headers=AUTH).json()
    assert m["corrected_turns"] == 1 and m["accuracy"] == 0.75

    # The voiceprint match was wrong: reassigning the person counts all of that speaker's turns.
    label = _by_name(r.json())["Priya"]["label"]
    client.patch(f"/api/meetings/{d['id']}/speakers/{label}", json={"person_id": sam["id"]}, headers=AUTH)
    m = client.get("/api/metrics/speakers", headers=AUTH).json()
    assert m["voiceprint_wrong"] == 1 and m["suggested_threshold"] is not None

    # A line can also start a brand-new speaker.
    r = client.patch(f"/api/meetings/{d['id']}/segments/{seg['id']}", json={"speaker_label": "new"}, headers=AUTH)
    assert r.json()["segments"][1]["speaker_label"] == "S3"


def test_platform_labels_beat_diarization(client, tmp_audio):
    vtt = """WEBVTT

1
00:00:00.400 --> 00:00:02.600
<v Priya Rao>Yesterday I finished the VPN tunnel.</v>

2
00:00:02.900 --> 00:00:05.100
<v Daniel Kim>Today I'm on the load test.</v>
"""
    turns = parse_vtt(vtt)
    assert [t["speaker"] for t in turns] == ["Priya Rao", "Daniel Kim"] and turns[0]["start"] == 0.4
    zoom = parse_vtt("WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nAna: hello there\n")
    assert zoom[0]["speaker"] == "Ana"

    r = client.post(
        "/api/meetings", json={"title": "Teams call", "profile": "general", "consent_confirmed": True}, headers=AUTH
    )
    m = r.json()
    r = client.put(
        f"/api/meetings/{m['id']}/platform-transcript", files={"file": ("t.vtt", vtt.encode())}, headers=AUTH
    )
    assert r.status_code == 200
    path = tmp_audio("teams.wav", 6.0, [[(0.5, 2.5, 500), (3.0, 5.0, 500)]])  # same pitch: diarizer would merge
    with open(path, "rb") as fh:
        client.put(f"/api/meetings/{m['id']}/audio", files={"file": ("teams.wav", fh)}, headers=AUTH)
    assert run_once(build_providers())
    d = client.get(f"/api/meetings/{m['id']}", headers=AUTH).json()
    names = _by_name(d)
    assert set(names) == {"Priya Rao", "Daniel Kim"}
    assert all(s["match_source"] == "platform" and s["person_id"] for s in d["speakers"])
    bad = client.put(
        f"/api/meetings/{m['id']}/platform-transcript", files={"file": ("x.vtt", b"WEBVTT\n")}, headers=AUTH
    )
    assert bad.status_code == 422


def test_summary_edits_and_gates(client, tmp_audio):
    d = _record(client, tmp_audio, [(0.5, 2.5, 400)])
    r = client.patch(f"/api/meetings/{d['id']}/summary", json={"data": {"overview": "Fixed by hand."}}, headers=AUTH)
    assert r.json()["summary"]["overview"] == "Fixed by hand."
    gates = client.get("/api/metrics/gates", headers=AUTH).json()
    assert [g["phase"] for g in gates] == [1, 2, 3, 4]
    assert all(g["passed"] is None for g in gates)  # not enough data yet
    gates = client.post("/api/metrics/gates/legal-review", json={"note": "counsel ok"}, headers=AUTH).json()
    assert gates[3]["passed"] is True and "Sai" in gates[3]["value"]
