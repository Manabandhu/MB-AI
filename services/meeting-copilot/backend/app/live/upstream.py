"""When LIVE_UPSTREAM points at a separate live process (the GPU box running live STT), live sessions
live there. The WebSocket is proxied in app.api.live; this middleware forwards the HTTP routes that
touch a live session (ask, captions, stop, bot joins and webhooks) so they reach the same process."""

import re

import httpx
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ..config import get_settings

LIVE_ROUTES = re.compile(r"^/api/(?:live/|bot/webhook|meetings/[^/]+/(?:live/|bot(?:/|$)))")
HOP = {"host", "content-length", "connection", "transfer-encoding", "keep-alive", "upgrade"}


def upstream_http(url: str) -> str:
    return re.sub(r"^ws", "http", url.rstrip("/"))


class LiveUpstreamMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        upstream = get_settings().live_upstream
        if not upstream or request.headers.get("x-copilot-upstream") or not LIVE_ROUTES.match(request.url.path):
            return await call_next(request)
        headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP}
        headers["x-copilot-upstream"] = "1"
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                r = await client.request(
                    request.method,
                    upstream_http(upstream) + request.url.path,
                    params=dict(request.query_params),
                    headers=headers,
                    content=await request.body(),
                )
            except httpx.HTTPError:
                return Response('{"detail":"the live service is unavailable"}', 502, media_type="application/json")
        out = {k: v for k, v in r.headers.items() if k.lower() not in HOP | {"content-encoding"}}
        return Response(r.content, r.status_code, headers=out)
