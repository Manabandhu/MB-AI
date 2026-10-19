import json

import pytest

from app.pipeline.profiles import get_profile
from app.pipeline.summarize import MeetingSummary, _to_seconds, parse_json_object, summarize_transcript
from app.providers.types import ProviderError


class ScriptedLLM:
    name = "scripted"

    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []

    def complete(self, system, messages, **kw):
        self.calls.append((system, messages, kw))
        return self.replies.pop(0)


GOOD = {
    "overview": "Short standup.",
    "people": [{"name": "Sai", "yesterday": ["VPN config"], "today": ["load test"], "blockers": []}],
    "key_points": ["plain string point"],
    "decisions": [],
    "action_items": [{"owner": "Sai", "text": "send runbook", "due": "Friday", "at": "2:05"}],
    "open_questions": [],
}


def test_parse_json_object_handles_fences_prose_and_braces_in_strings():
    reply = (
        'Sure! Here it is:\n```json\n{"overview": "uses {braces} and \\"quotes\\"", "people": []}\n```\nAnything else?'
    )
    assert parse_json_object(reply)["overview"] == 'uses {braces} and "quotes"'


def test_to_seconds_accepts_many_formats():
    assert _to_seconds("2:05") == 125
    assert _to_seconds("[1:02:03]") == 3723
    assert _to_seconds(42) == 42.0
    assert _to_seconds("nope") is None


def test_summary_is_validated_and_coerced():
    llm = ScriptedLLM([json.dumps(GOOD)])
    s = summarize_transcript(
        llm,
        "[0:01] Sai: hi",
        get_profile("standup"),
        title="Standup",
        started_at=None,
        speakers=["Sai"],
        max_chars=10_000,
    )
    assert isinstance(s, MeetingSummary)
    assert s.key_points[0].text == "plain string point"
    assert s.action_items[0].at == 125
    assert llm.calls[0][2]["json_mode"] is True


def test_invalid_json_is_retried_once():
    llm = ScriptedLLM(["not json at all", json.dumps(GOOD)])
    s = summarize_transcript(
        llm, "[0:01] Sai: hi", get_profile("standup"), title="t", started_at=None, speakers=[], max_chars=10_000
    )
    assert s.overview == "Short standup."
    assert len(llm.calls) == 2


def test_gives_up_after_two_bad_replies():
    llm = ScriptedLLM(["bad", "still bad"])
    with pytest.raises(ProviderError):
        summarize_transcript(
            llm, "[0:01] A: x", get_profile("general"), title="t", started_at=None, speakers=[], max_chars=10_000
        )


def test_long_transcripts_are_condensed_first():
    transcript = "\n".join(f"[{i // 60}:{i % 60:02d}] Sai: update number {i} with some detail" for i in range(200))
    llm = ScriptedLLM(["notes A", "notes B", "notes C", "notes D", json.dumps(GOOD)])
    summarize_transcript(
        llm, transcript, get_profile("standup"), title="t", started_at=None, speakers=[], max_chars=3000
    )
    condense_calls = [c for c in llm.calls if "TASK: condense-notes" in c[0]]
    assert len(condense_calls) >= 2
    final_prompt = llm.calls[-1][1][0]["content"]
    assert "notes A" in final_prompt and "update number 199" not in final_prompt


def test_general_profile_drops_people():
    llm = ScriptedLLM([json.dumps(GOOD)])
    s = summarize_transcript(
        llm, "[0:01] A: x", get_profile("general"), title="t", started_at=None, speakers=[], max_chars=10_000
    )
    assert s.people == []


def test_empty_transcript_skips_the_llm():
    llm = ScriptedLLM([])
    s = summarize_transcript(
        llm, "   ", get_profile("standup"), title="t", started_at=None, speakers=[], max_chars=10_000
    )
    assert "No speech" in s.overview
