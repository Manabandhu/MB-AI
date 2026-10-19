"""Shared test helpers: build meetings from exact transcript text (no audio needed)."""

from datetime import UTC, datetime, timedelta

from app.worker import build_providers, run_once

from .conftest import AUTH


def text_meeting(
    client,
    title: str,
    lines: list[tuple[str, str]],
    *,
    profile: str = "standup",
    days_ago: float = 0,
    attendees=(),
    headers=AUTH,
    providers=None,
) -> dict:
    """lines: [(speaker, text)], 5 seconds apart. "Sai" is the signed-in owner. Runs the worker."""
    started = (datetime.now(UTC) - timedelta(days=days_ago)).isoformat()
    r = client.post(
        "/api/meetings",
        json={
            "title": title,
            "profile": profile,
            "started_at": started,
            "consent_confirmed": True,
            "attendees": list(attendees),
        },  # fmt: skip
        headers=headers,
    )
    assert r.status_code == 201, r.text
    m = r.json()
    body = {
        "lines": [{"speaker": s, "start": i * 5.0, "end": i * 5.0 + 4.0, "text": t} for i, (s, t) in enumerate(lines)]
    }
    r = client.post(f"/api/meetings/{m['id']}/transcript", json=body, headers=headers)
    assert r.status_code == 200, r.text
    assert run_once(providers or build_providers())
    d = client.get(f"/api/meetings/{m['id']}", headers=headers).json()
    assert d["status"] == "done", d["error"]
    return d
