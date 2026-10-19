"""Maintenance commands: `python -m app.manage <command>`.

reindex   Rebuild the search index with the current embedding settings. Run this after
          changing EMBED_PROVIDER, EMBED_MODEL or EMBED_DIM. Transcripts and summaries are kept;
          the worker re-embeds every meeting in the background.
"""

import sys

from sqlalchemy import text, update

from .db import init_db, session_scope
from .models import Chunk, Meeting, MeetingStatus


def reindex() -> int:
    with session_scope() as session:
        session.execute(text(f"DROP TABLE IF EXISTS {Chunk.__tablename__}"))
    init_db()  # recreates the chunks table with the configured EMBED_DIM
    with session_scope() as session:
        result = session.execute(
            update(Meeting)
            .where(Meeting.status == MeetingStatus.DONE)
            .values(status=MeetingStatus.QUEUED, requested_stage="index", stage="waiting for worker")
        )
        return result.rowcount or 0


def main(argv: list[str]) -> None:
    if argv[:1] == ["reindex"]:
        n = reindex()
        print(f"Search index rebuilt; {n} meeting(s) queued for re-embedding.")
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])
