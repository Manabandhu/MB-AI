import json
import os
import time

import httpx
import numpy as np
import pytest
import soundfile as sf

from meeting_recorder.audio import SAMPLE_RATE, ChannelWriter, GapFiller, mixdown
from meeting_recorder.capture import FakeCapture
from meeting_recorder.client import ApiClient, ApiError
from meeting_recorder.session import (
    RecordingInfo,
    RecordingSession,
    now_iso,
    pending_recordings,
    recover_interrupted,
    upload_recording,
)


def info(stereo=True):
    return RecordingInfo(
        title="Standup", profile="standup", attendees=["A"], consent=True, stereo=stereo, started_at=now_iso()
    )


def test_gap_filler_pads_stalls_and_initial_delay():
    g = GapFiller(t0=100.0, tolerance_s=0.3)
    # first chunk of 0.1 s arrives 1 s late: 0.9 s of silence goes first
    assert g.silence_before(1600, now=101.0) == 16000 - 1600
    g.advance(16000)
    # a chunk arriving on time needs nothing
    assert g.silence_before(1600, now=101.1) == 0
    g.advance(1600)
    # small jitter under the tolerance is ignored
    assert g.silence_before(1600, now=101.3) == 0


def test_writer_and_mixdown_align_channels(tmp_path):
    t0 = time.monotonic()
    left = ChannelWriter(tmp_path / "mic.raw", t0)
    right = ChannelWriter(tmp_path / "meeting.raw", t0)
    tone = (0.3 * np.sin(2 * np.pi * 440 * np.arange(SAMPLE_RATE) / SAMPLE_RATE)).astype(np.float32)
    left.write(tone, t0 + 1.0)  # 1 s of audio
    right.write(np.stack([tone, tone], axis=1)[: SAMPLE_RATE // 2], t0 + 0.5)  # stereo device, 0.5 s
    left.close()
    right.close()
    assert left.level > 0.2  # smoothed meter, first chunk
    out = tmp_path / "out.flac"
    seconds = mixdown(left.path, right.path, out)
    assert seconds == pytest.approx(1.0, abs=0.01)
    data, sr = sf.read(str(out))
    assert sr == SAMPLE_RATE and data.shape == (SAMPLE_RATE, 2)
    assert np.abs(data[: SAMPLE_RATE // 2, 1]).max() > 0.2  # meeting channel has audio first half
    assert np.abs(data[SAMPLE_RATE // 2 + 100 :, 1]).max() == 0  # padded silence after
    assert not (tmp_path / "out.flac.part").exists()


def test_mono_mixdown_for_in_person(tmp_path):
    w = ChannelWriter(tmp_path / "mic.raw", time.monotonic())
    w.write(np.zeros(1600, dtype=np.float32), time.monotonic())
    w.close()
    mixdown(w.path, None, tmp_path / "o.flac")
    assert sf.info(str(tmp_path / "o.flac")).channels == 1


def test_fake_capture_session_records_both_channels(tmp_path):
    s = RecordingSession(tmp_path, FakeCapture, info())
    s.start()
    time.sleep(4.2)
    mic_level_seen = s.capture.levels()[0]
    flac = s.stop()
    data, sr = sf.read(str(flac))
    assert data.shape[1] == 2 and 3.5 < len(data) / sr < 5.0
    assert np.abs(data[:, 0]).max() > 0.2 and np.abs(data[:, 1]).max() > 0.2
    assert not (s.folder / "mic.raw").exists()
    assert pending_recordings(tmp_path) == [s.folder]
    assert mic_level_seen >= 0


def test_interrupted_recording_is_recovered(tmp_path):
    folder = tmp_path / "20261019-090000"
    folder.mkdir()
    info().save(folder)
    w = ChannelWriter(folder / "mic.raw", time.monotonic())
    w.write(np.full(SAMPLE_RATE, 0.1, dtype=np.float32), time.monotonic())
    w.file.flush()  # simulate a crash: never closed properly
    assert recover_interrupted(tmp_path) == [folder]
    assert (folder / "recording.flac").exists() and not (folder / "mic.raw").exists()


def _fake_server():
    state = {"creates": 0, "uploads": 0, "fail_upload": True}

    def handler(request: httpx.Request):
        if request.url.path == "/api/meetings" and request.method == "POST":
            state["creates"] += 1
            body = json.loads(request.content)
            assert body["channel_layout"] == "mic_system" and body["consent_confirmed"]
            return httpx.Response(201, json={"id": "m-1"})
        if request.url.path == "/api/meetings/m-1/audio":
            state["uploads"] += 1
            if state["fail_upload"]:
                return httpx.Response(503, json={"detail": "worker busy"})
            return httpx.Response(200, json={"id": "m-1", "status": "queued"})
        return httpx.Response(404)

    return state, httpx.MockTransport(handler)


def test_upload_retry_reuses_the_same_meeting(tmp_path):
    s = RecordingSession(tmp_path, FakeCapture, info())
    s.start()
    time.sleep(0.5)
    s.stop()
    state, transport = _fake_server()
    client = ApiClient("http://server", "tok", transport=transport)
    with pytest.raises(ApiError, match="503"):
        upload_recording(s.folder, client)
    assert s.folder.exists() and RecordingInfo.load(s.folder).meeting_id == "m-1"
    state["fail_upload"] = False
    progress = []
    assert upload_recording(s.folder, client, progress.append) == "m-1"
    assert state["creates"] == 1 and state["uploads"] == 2
    assert progress and progress[-1] == 1.0
    assert not s.folder.exists()


@pytest.mark.skipif(
    not os.environ.get("COPILOT_SERVER"), reason="set COPILOT_SERVER and COPILOT_TOKEN to run against a live server"
)
def test_against_live_server(tmp_path):
    client = ApiClient(os.environ["COPILOT_SERVER"], os.environ["COPILOT_TOKEN"])
    client.check()
    s = RecordingSession(tmp_path, FakeCapture, info())
    s.start()
    time.sleep(7)
    s.stop()
    meeting_id = upload_recording(s.folder, client)
    deadline = time.time() + 60
    while time.time() < deadline:
        m = client.http.get(f"/api/meetings/{meeting_id}").json()
        if m["status"] in ("done", "failed"):
            break
        time.sleep(1)
    assert m["status"] == "done", m.get("error")
    assert {sp["label"] for sp in m["speakers"]} >= {"me", "S1"}
