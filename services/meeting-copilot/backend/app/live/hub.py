"""In-process registry of live meetings and the browsers, phones or overlays watching them.

One capture source per meeting (a recorder, a bot's caption feed); any number of viewers. Events
are fanned out to every viewer and kept (last 500) so a viewer that joins late catches up.

The hub lives in one API process: run the API with a single worker (the default), or put live
traffic on one process with LIVE_UPSTREAM.
"""

import asyncio
import logging
import threading
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field

from .session import LiveSession

log = logging.getLogger(__name__)

HISTORY = 500
_REPLAY = {"notice", "brief", "nudges", "final", "card", "summary", "translation", "state", "stopped"}


@dataclass(eq=False)  # identity equality, so viewers can live in a set
class Viewer:
    loop: asyncio.AbstractEventLoop
    queue: asyncio.Queue


@dataclass
class Room:
    session: LiveSession | None = None
    viewers: set = field(default_factory=set)
    history: deque = field(default_factory=lambda: deque(maxlen=HISTORY))


class Hub:
    def __init__(self):
        self.rooms: dict[str, Room] = {}
        self.lock = threading.Lock()

    def room(self, meeting_id: str) -> Room:
        with self.lock:
            return self.rooms.setdefault(meeting_id, Room())

    def session(self, meeting_id: str) -> LiveSession | None:
        room = self.rooms.get(meeting_id)
        return room.session if room and room.session and not room.session.stopped else None

    def emitter(self, meeting_id: str) -> Callable[[dict], None]:
        room = self.room(meeting_id)

        def emit(event: dict) -> None:
            if event.get("type") in _REPLAY:
                room.history.append(event)
            for v in list(room.viewers):
                try:
                    v.loop.call_soon_threadsafe(v.queue.put_nowait, event)
                except RuntimeError:  # that viewer's loop is gone
                    room.viewers.discard(v)

        return emit

    def join(self, meeting_id: str, viewer: Viewer, replay: bool = True) -> None:
        room = self.room(meeting_id)
        if replay:
            for event in list(room.history):
                viewer.queue.put_nowait(event)
        room.viewers.add(viewer)

    def leave(self, meeting_id: str, viewer: Viewer) -> None:
        room = self.rooms.get(meeting_id)
        if room:
            room.viewers.discard(viewer)

    def attach(self, meeting_id: str, session: LiveSession) -> None:
        room = self.room(meeting_id)
        room.history.clear()
        room.session = session

    def detach(self, meeting_id: str) -> None:
        room = self.rooms.get(meeting_id)
        if room:
            room.session = None
            if not room.viewers:
                with self.lock:
                    self.rooms.pop(meeting_id, None)


hub = Hub()


def thread_spawner(loop: asyncio.AbstractEventLoop | None, emit: Callable[[dict], None]):
    """Run slow work (LLM, retrieval) off the audio path; report failures as events."""

    def spawn(fn: Callable[[], None]) -> None:
        def safe():
            try:
                fn()
            except Exception as e:  # a failed card must not end the meeting
                log.exception("live task failed")
                emit({"type": "error", "text": f"{type(e).__name__}: {e}"})

        if loop is None:
            threading.Thread(target=safe, daemon=True).start()
        else:
            loop.run_in_executor(None, safe)

    return spawn
