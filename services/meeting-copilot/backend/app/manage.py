"""Maintenance commands: `python -m app.manage <command>`.

migrate           Apply database migrations (the API and worker also do this at start-up).
reindex           Rebuild the search index with the current embedding settings. Run this after
                  changing EMBED_PROVIDER, EMBED_MODEL or EMBED_DIM. Transcripts and summaries are kept;
                  the worker re-embeds every meeting in the background.
create-token NAME Print a new personal access token for the bootstrap owner (e.g. for the desktop app).
"""

import sys

from sqlalchemy import text, update

from .auth import ensure_bootstrap_user, hash_token, new_token
from .config import get_settings
from .db import init_db, session_scope
from .models import ApiToken, Meeting, MeetingStatus


def reindex() -> int:
    """Resize the embedding columns to EMBED_DIM and queue every finished meeting for re-embedding."""
    dim = get_settings().embed_dim
    with session_scope() as session:
        session.execute(text("DELETE FROM chunks"))
        session.execute(text("DROP INDEX IF EXISTS ix_chunks_embedding_hnsw"))
        session.execute(text(f"ALTER TABLE chunks ALTER COLUMN embedding TYPE vector({dim})"))
        session.execute(
            text("CREATE INDEX ix_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)")
        )
        session.execute(text("UPDATE documents SET embedding = NULL"))
        session.execute(text(f"ALTER TABLE documents ALTER COLUMN embedding TYPE vector({dim})"))
        result = session.execute(
            update(Meeting)
            .where(Meeting.status == MeetingStatus.DONE)
            .values(status=MeetingStatus.QUEUED, requested_stage="index", stage="waiting for worker")
        )
        return result.rowcount or 0


def create_token(name: str) -> str:
    token = new_token()
    with session_scope() as session:
        user = ensure_bootstrap_user(session)
        session.add(ApiToken(user_id=user.id, name=name, token_hash=hash_token(token), prefix=token[:8]))
    return token


def main(argv: list[str]) -> None:
    if argv[:1] == ["migrate"]:
        init_db()
        print("Database is up to date.")
    elif argv[:1] == ["reindex"]:
        init_db()
        n = reindex()
        print(f"Search index rebuilt; {n} meeting(s) queued for re-embedding.")
    elif argv[:1] == ["create-token"] and len(argv) == 2:
        init_db()
        print(create_token(argv[1]))
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1:])
