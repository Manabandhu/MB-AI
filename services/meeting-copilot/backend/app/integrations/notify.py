"""Post meeting summaries to Slack or Microsoft Teams through incoming webhooks."""

import httpx

from ..models import ActionItem, Meeting


def summary_lines(m: Meeting, data: dict, items: list[ActionItem]) -> dict:
    decisions = [d if isinstance(d, str) else d.get("text", "") for d in data.get("decisions") or []]
    people = []
    for p in data.get("people") or []:
        bits = [f"{k}: {'; '.join(p[k])}" for k in ("yesterday", "today", "blockers") if p.get(k)]
        if bits:
            people.append(f"{p.get('name')} — " + " | ".join(bits))
    actions = [f"{a.owner + ': ' if a.owner else ''}{a.text}{' (due ' + a.due + ')' if a.due else ''}" for a in items]
    return {"overview": data.get("overview") or "", "people": people, "decisions": decisions, "actions": actions}


def slack_payload(m: Meeting, data: dict, items: list[ActionItem], link: str | None) -> dict:
    s = summary_lines(m, data, items)
    blocks = [{"type": "header", "text": {"type": "plain_text", "text": m.title[:150]}}]
    if s["overview"]:
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": s["overview"][:2900]}})
    for title, key in (("Updates", "people"), ("Decisions", "decisions"), ("Action items", "actions")):
        if s[key]:
            text = f"*{title}*\n" + "\n".join(f"• {x}" for x in s[key][:15])
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": text[:2900]}})
    if link:
        blocks.append(
            {"type": "context", "elements": [{"type": "mrkdwn", "text": f"<{link}|Open in Meeting Copilot>"}]}
        )
    return {"text": f"{m.title}: {s['overview'][:200]}", "blocks": blocks}


def teams_payload(m: Meeting, data: dict, items: list[ActionItem], link: str | None) -> dict:
    """An Adaptive Card, accepted by Teams Workflows ("When a Teams webhook request is received")."""
    s = summary_lines(m, data, items)
    body = [{"type": "TextBlock", "text": m.title, "weight": "Bolder", "size": "Medium", "wrap": True}]
    if s["overview"]:
        body.append({"type": "TextBlock", "text": s["overview"], "wrap": True})
    for title, key in (("Updates", "people"), ("Decisions", "decisions"), ("Action items", "actions")):
        if s[key]:
            body.append({"type": "TextBlock", "text": title, "weight": "Bolder", "spacing": "Medium"})
            body.append({"type": "TextBlock", "text": "\n".join(f"- {x}" for x in s[key][:15]), "wrap": True})
    card = {
        "type": "AdaptiveCard",
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.4",
        "body": body,
    }
    if link:
        card["actions"] = [{"type": "Action.OpenUrl", "title": "Open in Meeting Copilot", "url": link}]
    return {
        "type": "message",
        "attachments": [{"contentType": "application/vnd.microsoft.card.adaptive", "content": card}],
    }


def post_webhook(url: str, payload: dict, http: httpx.Client | None = None) -> None:
    http = http or httpx.Client(timeout=15.0)
    r = http.post(url, json=payload)
    if r.status_code >= 400:
        raise RuntimeError(f"webhook returned {r.status_code}: {r.text[:200]}")
