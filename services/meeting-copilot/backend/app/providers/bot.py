"""Meeting bots: join a Teams, Zoom or Meet call as a visible participant and capture it.

  attendee  Attendee (open source, self-hosted or attendee.dev)
  vexa      Vexa (open source, self-hosted or hosted)
  recall    Recall.ai (paid)
  fake      tests and demo mode

The bot's display name says it is recording (BOT_NAME), which is the in-call consent notice.
Identity comes free from the platform: each caption and each transcript turn carries the
participant's name, so the post-meeting pipeline uses those labels instead of diarization.

Webhook URLs carry our own HMAC signature (?mid=&sig=), so deliveries are authenticated the same way
whichever provider sends them. Teams tenants may need admin approval for third-party bots; the
desktop and browser recorders are the no-bot path.
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol
from urllib.parse import urlparse

import httpx
import numpy as np
import soundfile as sf

from ..config import Settings
from .types import ProviderError

log = logging.getLogger(__name__)


@dataclass
class BotInfo:
    id: str
    status: str


@dataclass
class BotResult:
    audio_path: Path | None
    turns: list[dict] = field(default_factory=list)  # [{"start", "end", "speaker", "text"}]


@dataclass
class BotEvent:
    kind: str  # state | caption | ignore
    bot_id: str | None = None
    state: str | None = None
    ended: bool = False
    caption: dict | None = None  # {"speaker", "text", "start", "end", "final"}


class MeetingBot(Protocol):
    name: str

    def join(self, meeting_url: str, bot_name: str, webhook_url: str) -> BotInfo: ...
    def leave(self, bot_id: str) -> None: ...
    def status(self, bot_id: str) -> str: ...
    def fetch_result(self, bot_id: str, meeting_url: str, folder: Path) -> BotResult: ...
    def parse_webhook(self, payload: dict) -> BotEvent: ...


ENDED = {"ended", "post_processing_completed", "done", "completed", "fatal_error", "call_ended", "left"}


def platform_of(url: str) -> tuple[str, str]:
    """(platform, native meeting id) for Vexa-style APIs."""
    host = (urlparse(url).hostname or "").lower()
    path = urlparse(url).path
    if "meet.google.com" in host:
        return "google_meet", path.strip("/").split("/")[0]
    if "zoom.us" in host:
        m = re.search(r"/j/(\d+)", path)
        return "zoom", m.group(1) if m else path.strip("/")
    if "teams.microsoft.com" in host or "teams.live.com" in host:
        return "teams", re.sub(r"\W+", "", path)[-60:]
    raise ProviderError("unsupported meeting link: use a Google Meet, Zoom or Microsoft Teams URL")


def _download(http: httpx.Client, url: str, dest: Path, headers: dict | None = None) -> Path:
    with http.stream("GET", url, headers=headers or {}, follow_redirects=True) as r:
        if r.status_code >= 400:
            raise ProviderError(f"recording download failed ({r.status_code})")
        with open(dest, "wb") as fh:
            for chunk in r.iter_bytes(1 << 20):
                fh.write(chunk)
    return dest


def _check(r: httpx.Response, what: str) -> dict | list:
    if r.status_code == 401 or r.status_code == 403:
        raise ProviderError(f"{what}: the bot API rejected the key ({r.status_code})")
    if r.status_code >= 400:
        raise ProviderError(f"{what} failed ({r.status_code}): {r.text[:200]}")
    return r.json() if r.content else {}


# -------------------------------------------------------------------------------------- Attendee


class AttendeeBot:
    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        if not settings.attendee_api_key:
            raise ProviderError("ATTENDEE_API_KEY is required when BOT_PROVIDER=attendee")
        self.base = settings.attendee_api_url.rstrip("/")
        self.h = {"Authorization": f"Token {settings.attendee_api_key}", "Content-Type": "application/json"}
        self.http = http or httpx.Client(timeout=30.0)
        self.name = "attendee"

    def join(self, meeting_url: str, bot_name: str, webhook_url: str) -> BotInfo:
        body = {
            "meeting_url": meeting_url,
            "bot_name": bot_name,
            "webhooks": [{"url": webhook_url, "triggers": ["bot.state_change", "transcript.update"]}],
        }
        data = _check(self.http.post(f"{self.base}/api/v1/bots", json=body, headers=self.h), "joining the meeting")
        return BotInfo(str(data["id"]), str(data.get("state", "joining")))

    def leave(self, bot_id: str) -> None:
        _check(self.http.post(f"{self.base}/api/v1/bots/{bot_id}/leave", headers=self.h), "leaving")

    def status(self, bot_id: str) -> str:
        return str(_check(self.http.get(f"{self.base}/api/v1/bots/{bot_id}", headers=self.h), "status").get("state"))

    def fetch_result(self, bot_id: str, meeting_url: str, folder: Path) -> BotResult:
        rec = _check(self.http.get(f"{self.base}/api/v1/bots/{bot_id}/recording", headers=self.h), "recording")
        audio = _download(self.http, rec["url"], folder / "bot.mp4") if rec.get("url") else None
        rows = _check(self.http.get(f"{self.base}/api/v1/bots/{bot_id}/transcript", headers=self.h), "transcript")
        turns = []
        for u in rows or []:
            start = float(u.get("timestamp_ms", 0)) / 1000
            turns.append(
                {
                    "start": start,
                    "end": start + float(u.get("duration_ms", 0)) / 1000,
                    "speaker": u.get("speaker_name") or "Unknown",
                    "text": ((u.get("transcription") or {}).get("transcript") or "").strip(),
                }
            )
        return BotResult(audio, turns)

    def parse_webhook(self, payload: dict) -> BotEvent:
        trigger, data = payload.get("trigger"), payload.get("data") or {}
        bot_id = str(payload.get("bot_id") or "")
        if trigger == "bot.state_change":
            state = str(data.get("new_state") or data.get("state") or "")
            return BotEvent("state", bot_id, state, ended=state in ENDED)
        if trigger == "transcript.update":
            start = float(data.get("timestamp_ms", 0)) / 1000
            text = ((data.get("transcription") or {}).get("transcript") or "").strip()
            cap = {
                "speaker": data.get("speaker_name") or "Speaker",
                "text": text,
                "start": start,
                "end": start + float(data.get("duration_ms", 0)) / 1000,
                "final": True,
            }
            return BotEvent("caption", bot_id, caption=cap)
        return BotEvent("ignore", bot_id)


# ------------------------------------------------------------------------------------------ Vexa


class VexaBot:
    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        if not settings.vexa_api_key:
            raise ProviderError("VEXA_API_KEY is required when BOT_PROVIDER=vexa")
        self.base = settings.vexa_api_url.rstrip("/")
        self.h = {"X-API-Key": settings.vexa_api_key}
        self.http = http or httpx.Client(timeout=30.0)
        self.name = "vexa"

    def join(self, meeting_url: str, bot_name: str, webhook_url: str) -> BotInfo:
        platform, native = platform_of(meeting_url)
        body = {"platform": platform, "native_meeting_id": native, "bot_name": bot_name}
        data = _check(self.http.post(f"{self.base}/bots", json=body, headers=self.h), "joining the meeting")
        # Vexa reports through polling (or its own webhook settings); keep the id as platform/native.
        return BotInfo(f"{platform}/{native}", str(data.get("status", "requested")))

    def leave(self, bot_id: str) -> None:
        _check(self.http.delete(f"{self.base}/bots/{bot_id}", headers=self.h), "leaving")

    def status(self, bot_id: str) -> str:
        meetings = _check(self.http.get(f"{self.base}/meetings", headers=self.h), "status").get("meetings", [])
        platform, native = bot_id.split("/", 1)
        for m in meetings:
            if m.get("platform") == platform and m.get("native_meeting_id") == native:
                return str(m.get("status", "unknown"))
        return "unknown"

    def fetch_result(self, bot_id: str, meeting_url: str, folder: Path) -> BotResult:
        data = _check(self.http.get(f"{self.base}/transcripts/{bot_id}", headers=self.h), "transcript")
        turns = [
            {
                "start": float(s.get("start", 0)),
                "end": float(s.get("end", 0)),
                "speaker": s.get("speaker") or "Unknown",
                "text": (s.get("text") or "").strip(),
            }
            for s in data.get("segments", [])
        ]
        return BotResult(None, turns)  # Vexa keeps transcripts; audio stays on the Vexa side

    def parse_webhook(self, payload: dict) -> BotEvent:
        status = str(payload.get("status") or (payload.get("data") or {}).get("status") or "")
        bot_id = f"{payload.get('platform', '')}/{payload.get('native_meeting_id', '')}"
        if status:
            return BotEvent("state", bot_id, status, ended=status in ENDED)
        return BotEvent("ignore", bot_id)


# ---------------------------------------------------------------------------------------- Recall


class RecallBot:
    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        if not settings.recall_api_key:
            raise ProviderError("RECALL_API_KEY is required when BOT_PROVIDER=recall")
        self.base = settings.recall_api_url.rstrip("/")
        self.h = {"Authorization": f"Token {settings.recall_api_key}", "Content-Type": "application/json"}
        self.http = http or httpx.Client(timeout=30.0)
        self.name = "recall"

    def join(self, meeting_url: str, bot_name: str, webhook_url: str) -> BotInfo:
        body = {
            "meeting_url": meeting_url,
            "bot_name": bot_name,
            "recording_config": {
                "transcript": {"provider": {"meeting_captions": {}}},
                "realtime_endpoints": [{"type": "webhook", "url": webhook_url, "events": ["transcript.data"]}],
            },
        }
        data = _check(self.http.post(f"{self.base}/api/v1/bot/", json=body, headers=self.h), "joining the meeting")
        return BotInfo(str(data["id"]), "joining")

    def leave(self, bot_id: str) -> None:
        _check(self.http.post(f"{self.base}/api/v1/bot/{bot_id}/leave_call/", headers=self.h), "leaving")

    def _bot(self, bot_id: str) -> dict:
        return _check(self.http.get(f"{self.base}/api/v1/bot/{bot_id}/", headers=self.h), "status")

    def status(self, bot_id: str) -> str:
        changes = self._bot(bot_id).get("status_changes") or [{}]
        return str(changes[-1].get("code", "unknown"))

    def fetch_result(self, bot_id: str, meeting_url: str, folder: Path) -> BotResult:
        rec = (self._bot(bot_id).get("recordings") or [{}])[0].get("media_shortcuts") or {}
        audio_url = ((rec.get("audio_mixed") or rec.get("video_mixed") or {}).get("data") or {}).get("download_url")
        audio = _download(self.http, audio_url, folder / "bot.mp4") if audio_url else None
        turns = []
        t_url = ((rec.get("transcript") or {}).get("data") or {}).get("download_url")
        if t_url:
            for part in self.http.get(t_url).json():
                words = part.get("words") or []
                if words:
                    turns.append(
                        {
                            "start": float(words[0]["start_timestamp"]["relative"]),
                            "end": float(words[-1]["end_timestamp"]["relative"]),
                            "speaker": (part.get("participant") or {}).get("name") or "Unknown",
                            "text": " ".join(w.get("text", "") for w in words).strip(),
                        }
                    )
        return BotResult(audio, turns)

    def parse_webhook(self, payload: dict) -> BotEvent:
        event, data = payload.get("event", ""), payload.get("data") or {}
        bot_id = str((data.get("bot") or {}).get("id") or "")
        if event == "transcript.data":
            d = data.get("data") or {}
            words = d.get("words") or []
            if not words:
                return BotEvent("ignore", bot_id)
            cap = {
                "speaker": (d.get("participant") or {}).get("name") or "Speaker",
                "text": " ".join(w.get("text", "") for w in words),
                "final": True,
                "start": float(words[0]["start_timestamp"]["relative"]),
                "end": float(words[-1]["end_timestamp"]["relative"]),
            }
            return BotEvent("caption", bot_id, caption=cap)
        if event.startswith("bot."):
            state = event.split(".", 1)[1]
            return BotEvent("state", bot_id, state, ended=state in ENDED)
        return BotEvent("ignore", bot_id)


# ------------------------------------------------------------------------------------------- fake


class FakeBot:
    """Joins nothing. Its "recording" is two voices, and the platform names them."""

    name = "fake-bot"
    TURNS = [
        {"start": 0.5, "end": 2.5, "speaker": "Priya Rao", "text": "I'm blocked on the firewall approval."},
        {"start": 3.0, "end": 5.0, "speaker": "Dan Lee", "text": "I'll send the runbook link today."},
    ]

    def __init__(self):
        self.joined: dict[str, str] = {}
        self.left: set[str] = set()

    def join(self, meeting_url: str, bot_name: str, webhook_url: str) -> BotInfo:
        platform_of(meeting_url)
        bot_id = f"fake-{len(self.joined) + 1}"
        self.joined[bot_id] = webhook_url
        return BotInfo(bot_id, "joining")

    def leave(self, bot_id: str) -> None:
        self.left.add(bot_id)

    def status(self, bot_id: str) -> str:
        return "ended" if bot_id in self.left else "joined_recording"

    def fetch_result(self, bot_id: str, meeting_url: str, folder: Path) -> BotResult:
        sr, data = 16000, np.zeros(16000 * 6, dtype=np.float32)
        for t, f in ((self.TURNS[0], 500), (self.TURNS[1], 500)):  # same pitch: diarization alone would merge them
            a, b = int(t["start"] * sr), int(t["end"] * sr)
            data[a:b] = 0.3 * np.sin(2 * np.pi * f * np.arange(b - a) / sr)
        path = folder / "bot.wav"
        sf.write(str(path), data, sr)
        return BotResult(path, [dict(t) for t in self.TURNS])

    def parse_webhook(self, payload: dict) -> BotEvent:
        return AttendeeBot.parse_webhook(self, payload)  # same shape as Attendee


class NoBot:
    name = "none"

    def _off(self, *a, **k):
        raise ProviderError("no meeting bot is configured (BOT_PROVIDER=none); use a recorder instead")

    join = leave = status = fetch_result = parse_webhook = _off
