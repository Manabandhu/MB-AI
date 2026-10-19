"""Background worker: `python -m app.worker`.

Polls Postgres for queued meetings (no Redis or SQS needed for a single user), runs the pipeline,
and purges expired audio once an hour. Models load once and stay in memory between meetings.
"""

import logging
import signal
import time

from .config import get_settings
from .db import SYSTEM, init_db, session_scope, set_scope
from .models import MeetingStatus
from .pipeline.process import Providers, claim_next, process_meeting, purge_expired_audio, requeue_interrupted
from .providers import ProviderError, get_diarizer, get_embedder, get_llm, get_speaker_embedder, get_transcriber
from .storage import get_storage

log = logging.getLogger("worker")

POLL_S = 2.0
PURGE_EVERY_S = 3600.0

_stop = False


def _handle_stop(signum, frame):  # pragma: no cover - signal handling
    global _stop
    _stop = True
    log.info("stopping after the current meeting")


def run_once(providers: Providers) -> bool:
    """Process at most one queued meeting. Returns True if one was processed."""
    settings = get_settings()
    storage = get_storage()
    with session_scope() as session:
        meeting = claim_next(session)
        if meeting is None:
            return False
        try:
            process_meeting(session, meeting, storage, providers, settings)
            log.info("meeting %s done", meeting.id)
        except Exception as e:
            session.rollback()
            set_scope(session, SYSTEM)
            meeting = session.merge(meeting)
            meeting.status = MeetingStatus.FAILED
            meeting.error = str(e) if isinstance(e, ProviderError) else f"{type(e).__name__}: {e}"
            session.commit()
            log.exception("meeting %s failed", meeting.id)
    return True


def build_providers() -> Providers:
    voiceprints = get_speaker_embedder()
    return Providers(
        stt=get_transcriber(),
        diarizer=get_diarizer(),
        llm=get_llm(),
        embedder=get_embedder(),
        voiceprints=None if voiceprints.name == "none" else voiceprints,
    )


def main() -> None:  # pragma: no cover - long-running loop
    settings = get_settings()
    logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    signal.signal(signal.SIGTERM, _handle_stop)
    signal.signal(signal.SIGINT, _handle_stop)

    init_db()
    with session_scope() as session:
        n = requeue_interrupted(session)
        if n:
            log.info("requeued %d interrupted meeting(s)", n)

    providers = build_providers()
    log.info(
        "worker ready: stt=%s diarizer=%s llm=%s embedder=%s",
        providers.stt.name, providers.diarizer.name, providers.llm.name, providers.embedder.name,
    )  # fmt: skip

    last_purge = 0.0
    while not _stop:
        if time.monotonic() - last_purge > PURGE_EVERY_S:
            with session_scope() as session:
                n = purge_expired_audio(session, get_storage(), settings.audio_retention_days)
                if n:
                    log.info(
                        "removed audio for %d meeting(s) past the %d-day retention", n, settings.audio_retention_days
                    )
            last_purge = time.monotonic()
        if not run_once(providers):
            time.sleep(POLL_S)


if __name__ == "__main__":  # pragma: no cover
    main()
