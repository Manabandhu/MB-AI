"""Measure it on your own meetings: the roadmap's four gates, plus speaker accuracy details.

Gate 1 (standup MVP)  summaries need at most one edit per standup across two weeks of real use
Gate 2 (speaker ID)   right speaker on at least 90% of turns in your own standups
Gate 3 (live assist)  card shows within 3 s and is rated useful at least 80% of the time
Gate 4 (every type)   consent flows and data handling pass legal and security review (a recorded sign-off)
"""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import Principal, current_principal, get_db, require_owner
from ..db import SYSTEM, new_session
from ..models import LiveCard, Meeting, MeetingStatus, Segment, Speaker, SpeakerCorrection, Summary, Workspace, utcnow

router = APIRouter(prefix="/api/metrics", dependencies=[Depends(current_principal)])

LATENCY_TARGET_MS = 3000


class SpeakerMetrics(BaseModel):
    meetings: int
    turns: int
    corrected_turns: int
    accuracy: float | None
    voiceprint_matches: int
    voiceprint_wrong: int
    match_scores_kept: list[float]
    match_scores_corrected: list[float]
    suggested_threshold: float | None


class Gate(BaseModel):
    phase: int
    name: str
    target: str
    value: str
    passed: bool | None  # None: not enough data yet
    detail: str


def _since(days: int) -> datetime:
    return datetime.now(UTC) - timedelta(days=days)


def speaker_metrics(db: Session, days: int, profile: str | None) -> SpeakerMetrics:
    stmt = select(Meeting.id).where(Meeting.status == MeetingStatus.DONE, Meeting.started_at >= _since(days))
    if profile:
        stmt = stmt.where(Meeting.profile == profile)
    ids = list(db.scalars(stmt))
    if not ids:
        return SpeakerMetrics(
            meetings=0, turns=0, corrected_turns=0, accuracy=None, voiceprint_matches=0, voiceprint_wrong=0,
            match_scores_kept=[], match_scores_corrected=[], suggested_threshold=None,
        )  # fmt: skip
    turns = db.scalar(select(func.count()).select_from(Segment).where(Segment.meeting_id.in_(ids))) or 0
    per_meeting = dict(
        db.execute(
            select(SpeakerCorrection.meeting_id, func.sum(SpeakerCorrection.segments_affected))
            .where(SpeakerCorrection.meeting_id.in_(ids))
            .group_by(SpeakerCorrection.meeting_id)
        ).all()
    )
    seg_counts = dict(
        db.execute(
            select(Segment.meeting_id, func.count()).where(Segment.meeting_id.in_(ids)).group_by(Segment.meeting_id)
        ).all()
    )
    corrected = sum(min(int(n), seg_counts.get(mid, 0)) for mid, n in per_meeting.items())

    matched = db.execute(
        select(Speaker.meeting_id, Speaker.label, Speaker.match_score).where(
            Speaker.meeting_id.in_(ids),
            Speaker.match_source.in_(["voiceprint", "manual"]),
            Speaker.match_score.is_not(None),
        )  # fmt: skip
    ).all()
    wrong_keys = {
        (c.meeting_id, c.from_label)
        for c in db.scalars(
            select(SpeakerCorrection).where(SpeakerCorrection.meeting_id.in_(ids), SpeakerCorrection.kind == "person")
        )
    }
    kept = sorted(round(s, 3) for mid, lbl, s in matched if (mid, lbl) not in wrong_keys)
    wrong = sorted(round(s, 3) for mid, lbl, s in matched if (mid, lbl) in wrong_keys)
    suggested = None
    if kept and wrong:
        suggested = round((min(kept) + max(wrong)) / 2, 3) if max(wrong) < min(kept) else round(max(wrong) + 0.01, 3)
    elif wrong:
        suggested = round(max(wrong) + 0.01, 3)
    return SpeakerMetrics(
        meetings=len(ids),
        turns=turns,
        corrected_turns=corrected,
        accuracy=round(1 - corrected / turns, 4) if turns else None,
        voiceprint_matches=len(matched),
        voiceprint_wrong=len(wrong),
        match_scores_kept=kept,
        match_scores_corrected=wrong,
        suggested_threshold=suggested,
    )


@router.get("/speakers", response_model=SpeakerMetrics)
def speakers(days: int = Query(14, ge=1, le=365), profile: str | None = None, db: Session = Depends(get_db)):
    return speaker_metrics(db, days, profile)


class LiveMetrics(BaseModel):
    cards: int
    within_target: float | None
    rated: int
    useful: float | None
    median_ms: float | None
    p90_ms: float | None
    not_in_history: int


def live_metrics(db: Session, days: int) -> LiveMetrics:
    cards = db.scalars(select(LiveCard).where(LiveCard.created_at >= _since(days), LiveCard.kind == "answer")).all()
    totals = sorted(c.timings_ms.get("total", 0) for c in cards if c.timings_ms.get("total") is not None)
    rated = [c for c in cards if c.feedback]

    def pct(xs, q):
        return float(xs[min(len(xs) - 1, int(q * len(xs)))]) if xs else None

    return LiveMetrics(
        cards=len(cards),
        within_target=round(sum(1 for t in totals if t <= LATENCY_TARGET_MS) / len(totals), 4) if totals else None,
        rated=len(rated),
        useful=round(sum(1 for c in rated if c.feedback > 0) / len(rated), 4) if rated else None,
        median_ms=pct(totals, 0.5),
        p90_ms=pct(totals, 0.9),
        not_in_history=sum(1 for c in cards if not c.grounded),
    )


@router.get("/live", response_model=LiveMetrics)
def live(days: int = Query(14, ge=1, le=365), db: Session = Depends(get_db)):
    return live_metrics(db, days)


@router.get("/gates", response_model=list[Gate])
def gates(db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    out: list[Gate] = []

    standups = (
        db.execute(
            select(Summary.edit_count)
            .join(Meeting, Meeting.id == Summary.meeting_id)
            .where(Meeting.profile == "standup", Meeting.started_at >= _since(14))
        )
        .scalars()
        .all()
    )
    worst = max(standups, default=None)
    out.append(
        Gate(
            phase=1,
            name="Standup MVP",
            target="≤ 1 summary edit per standup over 2 weeks",
            value="no standups yet" if worst is None else f"{len(standups)} standups, at most {worst} edit(s)",
            passed=None if len(standups) < 5 else worst <= 1,
            detail="Needs at least 5 standups in the last 14 days.",
        )  # fmt: skip
    )

    sm = speaker_metrics(db, 14, "standup")
    out.append(
        Gate(
            phase=2,
            name="Speaker ID",
            target="right speaker on ≥ 90% of turns in your standups",
            value="no data" if sm.accuracy is None else f"{sm.accuracy:.1%} of {sm.turns} turns",
            passed=None if sm.turns < 50 else sm.accuracy >= 0.9,
            detail="Every fix-speaker tap, merge or re-assignment counts against accuracy. Needs 50+ turns.",
        )  # fmt: skip
    )

    lm = live_metrics(db, 14)
    ok = lm.within_target is not None and lm.useful is not None
    out.append(
        Gate(
            phase=3,
            name="Live assist",
            target="card within 3 s and rated useful ≥ 80%",
            value="no rated cards" if not ok else f"{lm.within_target:.0%} within 3 s, {lm.useful:.0%} useful",
            passed=None if not ok or lm.rated < 10 else (lm.within_target >= 0.8 and lm.useful >= 0.8),
            detail="Needs at least 10 rated answer cards.",
        )  # fmt: skip
    )

    with new_session(SYSTEM) as s:
        review = (s.get(Workspace, principal.workspace_id).settings or {}).get("legal_review")
    out.append(
        Gate(
            phase=4,
            name="Every meeting type",
            target="consent and data handling pass legal and security review",
            value=f"signed off by {review['by']} on {review['at'][:10]}" if review else "not signed off",
            passed=bool(review) or None,
            detail="Have counsel check the consent flows before any public launch; a workspace owner records it.",
        )  # fmt: skip
    )
    return out


class ReviewSignOff(BaseModel):
    note: str = ""


@router.post("/gates/legal-review", response_model=list[Gate])
def sign_off_review(body: ReviewSignOff, principal: Principal = Depends(require_owner), db: Session = Depends(get_db)):
    with new_session(SYSTEM) as s:
        ws = s.get(Workspace, principal.workspace_id)
        ws.settings = {
            **(ws.settings or {}),
            "legal_review": {"by": principal.display_name, "at": utcnow().isoformat(), "note": body.note},
        }
        s.commit()
    return gates(db, principal)
