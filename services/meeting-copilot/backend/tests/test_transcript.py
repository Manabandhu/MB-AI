from app.pipeline.chunking import chunk_lines
from app.pipeline.transcript import (
    Line,
    assign_speakers,
    drop_echo,
    format_transcript,
    merge_adjacent,
    relabel,
)
from app.providers.types import SpeakerTurn, TranscriptSegment, Word


def test_assign_splits_segment_at_speaker_change_using_words():
    seg = TranscriptSegment(
        0.0,
        4.0,
        "hi there how are you",
        words=[
            Word(0.0, 0.5, " hi"),
            Word(0.5, 1.0, " there"),
            Word(2.1, 2.5, " how"),
            Word(2.5, 3.0, " are"),
            Word(3.0, 3.5, " you"),
        ],
    )
    turns = [SpeakerTurn(0.0, 1.8, "A"), SpeakerTurn(2.0, 4.0, "B")]
    lines = assign_speakers([seg], turns, fallback="x")
    assert [(ln.speaker, ln.text) for ln in lines] == [("A", "hi there"), ("B", "how are you")]


def test_assign_without_words_uses_majority_overlap():
    seg = TranscriptSegment(0.0, 10.0, "long segment")
    turns = [SpeakerTurn(0.0, 3.0, "A"), SpeakerTurn(3.0, 10.0, "B")]
    assert assign_speakers([seg], turns, fallback="x")[0].speaker == "B"


def test_assign_uses_nearest_turn_then_fallback():
    turns = [SpeakerTurn(5.0, 6.0, "A")]
    near = TranscriptSegment(6.3, 6.8, "close")
    far = TranscriptSegment(20.0, 21.0, "far away")
    lines = assign_speakers([near, far], turns, fallback="others")
    assert [ln.speaker for ln in lines] == ["A", "others"]


def test_provider_speakers_are_kept():
    seg = TranscriptSegment(0, 1, "hello", speaker="dg3")
    assert assign_speakers([seg], [], fallback="x")[0].speaker == "dg3"


def test_relabel_orders_by_first_appearance_and_keeps_owner():
    lines = [
        Line(5, 6, "SPEAKER_07", "b"),
        Line(0, 1, "me", "a"),
        Line(2, 3, "SPEAKER_02", "c"),
        Line(7, 8, "SPEAKER_07", "d"),
    ]
    out = relabel(lines)
    assert [ln.speaker for ln in out] == ["me", "S1", "S2", "S2"]


def test_drop_echo_removes_leaked_speaker_audio_only():
    others = [Line(10.0, 13.0, "S1", "the deploy is scheduled for thursday night")]
    mine = [
        Line(10.2, 13.1, "me", "deploy is scheduled for thursday"),  # echo
        Line(15.0, 16.0, "me", "sounds good to me"),  # real
    ]
    kept = drop_echo(mine, others)
    assert [ln.text for ln in kept] == ["sounds good to me"]


def test_merge_adjacent_joins_same_speaker_within_gap():
    lines = [Line(0, 2, "S1", "a"), Line(2.5, 4, "S1", "b"), Line(4.2, 5, "S2", "c"), Line(9, 10, "S2", "d")]
    out = merge_adjacent(lines, max_gap=1.0)
    assert [(ln.speaker, ln.text) for ln in out] == [("S1", "a b"), ("S2", "c"), ("S2", "d")]


def test_format_transcript_uses_display_names():
    text = format_transcript([Line(65, 70, "me", "hello")], {"me": "Sai"})
    assert text == "[1:05] Sai: hello"


def test_chunks_respect_window_and_overlap_one_line():
    lines = [Line(i * 10.0, i * 10.0 + 8, "S1", f"line {i}") for i in range(12)]
    chunks = chunk_lines(lines, {"S1": "Priya"}, target_s=45)
    assert len(chunks) >= 2
    assert all(c.end - c.start <= 60 for c in chunks)
    assert chunks[0].text.splitlines()[-1] == chunks[1].text.splitlines()[0]  # overlap
    assert chunks[0].speakers == ["Priya"]
