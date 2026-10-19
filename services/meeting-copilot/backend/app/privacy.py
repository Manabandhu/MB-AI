"""Privacy helpers: PII redaction on transcripts, and the local-only guard for sensitive meetings."""

import ipaddress
import re
from urllib.parse import urlparse

from .config import Settings

_EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
# 13-19 digits, optionally grouped by spaces or dashes; confirmed with the Luhn check below.
_CARD = re.compile(r"\b(?:\d[ -]?){12,18}\d\b")
# North American and international numbers: +1 (555) 123-4567, 555-123-4567, +44 20 7946 0958
# Never part of a longer run of digit groups (so ticket or order numbers are left alone).
_PHONE = re.compile(
    r"(?<![\w-])(?<!\d[ .-])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})"
    r"[\s.-]\d{3,4}[\s.-]\d{3,4}(?![\w-])(?![\s.-]?\d)"
)


def _luhn(digits: str) -> bool:
    total, parity = 0, len(digits) % 2
    for i, ch in enumerate(digits):
        d = int(ch)
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def redact_pii(text: str, categories: set[str]) -> str:
    """Mask emails, card numbers, SSNs and phone numbers. Order matters: cards before phones."""
    if "email" in categories:
        text = _EMAIL.sub("[email]", text)
    if "ssn" in categories:
        text = _SSN.sub("[ssn]", text)
    if "card" in categories:

        def card(m: re.Match) -> str:
            digits = re.sub(r"\D", "", m.group(0))
            return "[card]" if 13 <= len(digits) <= 19 and _luhn(digits) else m.group(0)

        text = _CARD.sub(card, text)
    if "phone" in categories:
        text = _PHONE.sub("[phone]", text)
    return text


def maybe_redact(text: str, settings: Settings) -> str:
    return redact_pii(text, settings.pii_category_set) if settings.pii_redaction else text


# ------------------------------------------------------------------------------- local-only mode


def is_remote_url(url: str) -> bool:
    """True when a model server URL leaves this machine/VPC (anything but localhost, private IPs,
    or a bare Docker service name like `ollama`)."""
    host = (urlparse(url).hostname or "").lower()
    if not host or host == "localhost" or "." not in host:
        return False
    try:
        ip = ipaddress.ip_address(host)
        return not (ip.is_private or ip.is_loopback or ip.is_link_local)
    except ValueError:
        return not host.endswith((".local", ".internal", ".lan"))


def third_party_providers(settings: Settings, *, live: bool = False) -> list[str]:
    """Which configured providers would send this meeting's audio or text to someone else."""
    out = []
    if live:
        if settings.live_stt_provider == "deepgram":
            out.append("LIVE_STT_PROVIDER=deepgram")
    else:
        if settings.stt_provider == "deepgram":
            out.append("STT_PROVIDER=deepgram")
    if settings.bot_provider == "recall":
        out.append("BOT_PROVIDER=recall")
    elif settings.bot_provider in ("attendee", "vexa"):
        url = settings.attendee_api_url if settings.bot_provider == "attendee" else settings.vexa_api_url
        if is_remote_url(url):
            out.append(f"BOT_PROVIDER={settings.bot_provider} at {url}")
    if settings.llm_provider == "bedrock":
        out.append("LLM_PROVIDER=bedrock")
    elif settings.llm_provider == "openai_compat" and is_remote_url(settings.llm_base_url):
        out.append(f"LLM_BASE_URL={settings.llm_base_url}")
    if settings.embed_provider == "bedrock":
        out.append("EMBED_PROVIDER=bedrock")
    elif settings.embed_provider == "openai_compat" and is_remote_url(settings.embed_base_url):
        out.append(f"EMBED_BASE_URL={settings.embed_base_url}")
    return out
