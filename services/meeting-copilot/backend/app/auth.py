"""Single-user auth: one bearer token (API_TOKEN), plus short-lived signed links for the audio player."""

import hashlib
import hmac
import time

from fastapi import Header, HTTPException, status

from .config import get_settings


def require_token(authorization: str | None = Header(default=None)) -> None:
    expected = get_settings().api_token
    if not expected:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "API_TOKEN is not configured on the server")
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(token.encode(), expected.encode()):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid or missing token", {"WWW-Authenticate": "Bearer"})


def _key() -> bytes:
    return hashlib.sha256(b"media-link:" + get_settings().api_token.encode()).digest()


def sign_media(meeting_id: str, ttl_s: int = 3600, now: float | None = None) -> tuple[int, str]:
    exp = int((now or time.time()) + ttl_s)
    sig = hmac.new(_key(), f"{meeting_id}:{exp}".encode(), hashlib.sha256).hexdigest()
    return exp, sig


def verify_media(meeting_id: str, exp: int, sig: str, now: float | None = None) -> bool:
    if exp < (now or time.time()):
        return False
    expected = hmac.new(_key(), f"{meeting_id}:{exp}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)
