"""Split a transcript into retrieval chunks of roughly 30-60 seconds."""

from dataclasses import dataclass

from .transcript import Line


@dataclass
class ChunkText:
    start: float
    end: float
    speakers: list[str]
    text: str


def chunk_lines(
    lines: list[Line],
    names: dict[str, str],
    target_s: float = 45.0,
    max_chars: int = 1800,
) -> list[ChunkText]:
    """Greedy windows: close a chunk once it spans target_s seconds or max_chars characters.

    The last line of each chunk is repeated at the start of the next, so an answer that straddles
    a boundary is still found whole in one chunk.
    """
    chunks: list[ChunkText] = []
    current: list[Line] = []

    def flush():
        if not current:
            return
        speakers = list(dict.fromkeys(names.get(ln.speaker, ln.speaker) for ln in current))
        text = "\n".join(f"{names.get(ln.speaker, ln.speaker)}: {ln.text}" for ln in current)
        chunks.append(ChunkText(current[0].start, current[-1].end, speakers, text))

    for ln in lines:
        if current:
            span = ln.end - current[0].start
            size = sum(len(x.text) for x in current) + len(ln.text)
            if span > target_s or size > max_chars:
                flush()
                current = [current[-1]] if len(current) > 1 else []
        current.append(ln)
    flush()
    return chunks
