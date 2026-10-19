"""Small client for the Meeting Copilot API."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from pathlib import Path

import httpx


class ApiError(RuntimeError):
    pass


class _ProgressFile:
    """File wrapper that reports how much has been read (httpx reads uploads in chunks)."""

    def __init__(self, path: Path, on_progress: Callable[[float], None] | None):
        self._fh = open(path, "rb")
        self._size = path.stat().st_size or 1
        self._read = 0
        self._cb = on_progress

    def read(self, n: int = -1) -> bytes:
        data = self._fh.read(n)
        self._read += len(data)
        if self._cb:
            self._cb(min(1.0, self._read / self._size))
        return data

    def close(self):
        self._fh.close()


class ApiClient:
    def __init__(
        self, base_url: str, token: str, verify_tls: bool = True, transport: httpx.BaseTransport | None = None
    ):
        self.base_url = base_url.rstrip("/")
        self.http = httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(60.0, write=600.0),
            verify=verify_tls,
            transport=transport,
        )

    def _check(self, resp: httpx.Response) -> dict:
        if resp.status_code == 401:
            raise ApiError("The server rejected the access token. Check it in Settings.")
        if resp.status_code >= 400:
            try:
                detail = resp.json().get("detail")
            except ValueError:
                detail = resp.text[:200]
            raise ApiError(f"Server error {resp.status_code}: {detail}")
        return resp.json() if resp.content else {}

    def check(self) -> dict:
        try:
            return self._check(self.http.get("/api/config"))
        except httpx.HTTPError as e:
            raise ApiError(f"Can't reach {self.base_url}: {e}") from e

    def create_meeting(
        self,
        title: str,
        profile: str,
        started_at: datetime,
        attendees: list[str],
        stereo: bool,
        consent: bool,
    ) -> dict:
        body = {
            "title": title,
            "profile": profile,
            "started_at": started_at.isoformat(),
            "attendees": attendees,
            "channel_layout": "mic_system" if stereo else "mono",
            "consent_confirmed": consent,
            "consent_method": "tap",
            "source": "desktop",
        }
        try:
            return self._check(self.http.post("/api/meetings", json=body))
        except httpx.HTTPError as e:
            raise ApiError(f"Can't reach {self.base_url}: {e}") from e

    def upload(self, meeting_id: str, path: Path, on_progress: Callable[[float], None] | None = None) -> dict:
        f = _ProgressFile(path, on_progress)
        try:
            resp = self.http.put(f"/api/meetings/{meeting_id}/audio", files={"file": (path.name, f, "audio/flac")})
            return self._check(resp)
        except httpx.HTTPError as e:
            raise ApiError(f"Upload failed: {e}") from e
        finally:
            f.close()

    def meeting_url(self, meeting_id: str) -> str:
        return f"{self.base_url}/meetings/{meeting_id}"
