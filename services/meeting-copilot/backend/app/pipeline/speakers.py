"""Who is each speaker? Use the cheapest reliable signal first:

1. Per-participant audio or platform speaker labels (meeting bot, Teams transcript): identity is free.
2. Your mic channel: always you.
3. Own diarization plus opt-in voiceprints: each cluster's average embedding is matched against
   the enrolled voiceprints of the meeting's attendees (all enrolled people when no attendees are
   known). Anything below the threshold stays "Speaker N" until someone names it.
"""

import logging
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import Settings
from ..models import Meeting, Person, Voiceprint
from ..providers.voiceprint import SpeakerEmbedder, cosine, embed_spans, mean_embedding
from .people import attendee_people
from .transcript import OWNER_LABEL, Line

log = logging.getLogger(__name__)

MAX_SPANS_PER_SPEAKER = 12


@dataclass
class Match:
    person: Person
    score: float


def cluster_embeddings(embedder: SpeakerEmbedder, wav: Path, lines: list[Line]) -> dict[str, list[float]]:
    """Average embedding per speaker label, from that speaker's longest turns."""
    by_label: dict[str, list[Line]] = {}
    for ln in lines:
        if ln.speaker != OWNER_LABEL:
            by_label.setdefault(ln.speaker, []).append(ln)
    out = {}
    for label, own in by_label.items():
        longest = sorted(own, key=lambda x: x.end - x.start, reverse=True)[:MAX_SPANS_PER_SPEAKER]
        vec = mean_embedding(embed_spans(embedder, wav, [(x.start, x.end) for x in longest]))
        if vec is not None:
            out[label] = vec
    return out


def candidate_voiceprints(session: Session, meeting: Meeting, model: str) -> list[tuple[Person, list[float]]]:
    """Enrolled voiceprints to compare against: the attendees', or everyone's if attendees are unknown."""
    stmt = (
        select(Voiceprint, Person)
        .join(Person, Person.id == Voiceprint.person_id)
        .where(Voiceprint.model == model, Person.consent_at.is_not(None))
    )
    rows = session.execute(stmt).all()
    attendees = attendee_people(session, meeting.attendees or [])
    if attendees:
        allowed = {p.id for p in attendees}
        rows = [(v, p) for v, p in rows if p.id in allowed]
    by_person: dict[str, tuple[Person, list[list[float]]]] = {}
    for v, p in rows:
        by_person.setdefault(p.id, (p, []))[1].append(list(v.embedding))
    return [(p, mean_embedding(vecs)) for p, vecs in by_person.values()]


def match_clusters(
    clusters: dict[str, list[float]], candidates: list[tuple[Person, list[float]]], threshold: float
) -> dict[str, Match]:
    """One person per cluster and one cluster per person, best scores first."""
    scored = sorted(
        ((cosine(vec, pvec), label, person) for label, vec in clusters.items() for person, pvec in candidates),
        key=lambda x: x[0],
        reverse=True,
    )
    out: dict[str, Match] = {}
    used: set[str] = set()
    for score, label, person in scored:
        if score < threshold or label in out or person.id in used:
            continue
        out[label] = Match(person, round(score, 4))
        used.add(person.id)
    return out


def identify_by_voiceprint(
    session: Session, meeting: Meeting, embedder: SpeakerEmbedder, wav: Path, lines: list[Line], settings: Settings
) -> dict[str, Match]:
    candidates = candidate_voiceprints(session, meeting, embedder.name)
    if not candidates:
        return {}
    clusters = cluster_embeddings(embedder, wav, lines)
    matches = match_clusters(clusters, candidates, settings.voiceprint_threshold)
    log.info("meeting %s: matched %d of %d speaker(s) by voiceprint", meeting.id, len(matches), len(clusters))
    return matches
