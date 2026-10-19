"""Export a meeting as Markdown (for docs, email or a ticket) or as JSON (for other tools)."""

from ..models import Meeting
from .transcript import fmt_ts


def _names(m: Meeting) -> dict[str, str]:
    return {s.label: s.display_name for s in m.speakers}


def meeting_json(m: Meeting) -> dict:
    names = _names(m)
    return {
        "id": m.id,
        "title": m.title,
        "profile": m.profile,
        "started_at": m.started_at.isoformat(),
        "duration_s": m.duration_s,
        "attendees": m.attendees or [],
        "speakers": [{"label": s.label, "name": s.display_name} for s in m.speakers],
        "summary": m.summary.data if m.summary else None,
        "action_items": [
            {"owner": a.owner, "text": a.text, "due": a.due, "at": a.at, "done": a.done} for a in m.action_items
        ],
        "transcript": [
            {"start": s.start, "end": s.end, "speaker": names.get(s.speaker_label, s.speaker_label), "text": s.text}
            for s in m.segments
        ],
        "off_record": m.off_record or [],
    }


def _bullets(items) -> list[str]:
    return [f"- {i}" for i in items]


def summary_markdown(data: dict, fields_meta: list[dict] | None = None) -> list[str]:
    out: list[str] = []
    if data.get("overview"):
        out += [data["overview"], ""]
    for p in data.get("people") or []:
        out.append(f"### {p.get('name')}")
        for key, label in (("yesterday", "Yesterday"), ("today", "Today"), ("blockers", "Blockers")):
            if p.get(key):
                out.append(f"**{label}:** " + "; ".join(p[key]))
        out.append("")
    labels = {f["key"]: f.get("label", f["key"]) for f in (fields_meta or [])}
    for key, value in (data.get("fields") or {}).items():
        if not value:
            continue
        out.append(f"### {labels.get(key, key.replace('_', ' ').title())}")
        out += _bullets(value) if isinstance(value, list) else [str(value)]
        out.append("")
    decisions = [d if isinstance(d, str) else d.get("text", "") for d in data.get("decisions") or []]
    if decisions:
        out += ["### Decisions", *_bullets(decisions), ""]
    if data.get("open_questions"):
        out += ["### Open questions", *_bullets(data["open_questions"]), ""]
    return out


def meeting_markdown(m: Meeting) -> str:
    names = _names(m)
    lines = [f"# {m.title}", "", f"{m.started_at:%A %Y-%m-%d %H:%M} UTC"]
    if m.duration_s:
        lines[-1] += f" · {round(m.duration_s / 60)} min"
    if m.speakers:
        lines.append("Speakers: " + ", ".join(s.display_name for s in m.speakers))
    lines.append("")
    if m.summary:
        lines += ["## Summary", "", *summary_markdown(m.summary.data, m.summary.data.get("fields_meta"))]
    if m.action_items:
        lines += ["## Action items", ""]
        for a in m.action_items:
            owner = f"**{a.owner}:** " if a.owner else ""
            due = f" (due {a.due})" if a.due else ""
            lines.append(f"- [{'x' if a.done else ' '}] {owner}{a.text}{due}")
        lines.append("")
    if m.segments:
        lines += ["## Transcript", ""]
        gaps = sorted(m.off_record or [])
        for s in m.segments:
            while gaps and gaps[0][0] <= s.start:
                g = gaps.pop(0)
                lines.append(f"*[{fmt_ts(g[0])}–{fmt_ts(g[1])}] off the record*")
            lines.append(f"[{fmt_ts(s.start)}] **{names.get(s.speaker_label, s.speaker_label)}:** {s.text}")
        for g in gaps:
            lines.append(f"*[{fmt_ts(g[0])}–{fmt_ts(g[1])}] off the record*")
    return "\n".join(lines).rstrip() + "\n"
