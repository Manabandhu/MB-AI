"""Rollups, timesheets, missed-meeting digests and the blocker radar."""

from datetime import UTC, date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from ..auth import Principal, current_principal, get_db
from ..models import Meeting
from ..services.insights import blocker_radar, missed_meeting_digest, rollup, rollup_markdown

router = APIRouter(prefix="/api", dependencies=[Depends(current_principal)])


def _range(since: date | None, until: date | None) -> tuple[datetime, datetime]:
    today = datetime.now(UTC).date()
    until = until or today
    since = since or (until - timedelta(days=until.weekday()))  # this week, Monday on
    return datetime.combine(since, time.min, tzinfo=UTC), datetime.combine(
        until + timedelta(days=1), time.min, tzinfo=UTC
    )


@router.get("/rollup")
def get_rollup(
    since: date | None = None,
    until: date | None = None,
    format: str = Query("json", pattern="^(json|md)$"),
    db: Session = Depends(get_db),
):
    """Weekly or sprint rollup for managers, retros and timesheets."""
    lo, hi = _range(since, until)
    if hi - lo > timedelta(days=93):
        raise HTTPException(422, "pick a range of at most three months")
    r = rollup(db, lo, hi)
    if format == "md":
        return PlainTextResponse(rollup_markdown(r), media_type="text/markdown")
    return r


@router.get("/meetings/{meeting_id}/digest")
def get_digest(meeting_id: str, db: Session = Depends(get_db), principal: Principal = Depends(current_principal)):
    """A meeting you missed, cut down to what mentions you or your work."""
    m = db.get(Meeting, meeting_id)
    if m is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "meeting not found")
    return missed_meeting_digest(db, m, principal)


@router.get("/blocker-radar")
def get_blocker_radar(days: int = Query(14, ge=2, le=90), db: Session = Depends(get_db)):
    """Recurring cross-team dependencies, from standup blockers, as nudges."""
    return blocker_radar(db, days)
