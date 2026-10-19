"""One recording from start to upload, independent of the UI.

Recordings are written under recordings_dir()/<timestamp>/ and only removed after the server
has accepted the upload, so a crash, a closed laptop or a dead network never loses a meeting.
"""

from __future__ import annotations

import json
import shutil
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

from .audio import mixdown
from .capture import Capture
from .client import ApiClient


@dataclass
class RecordingInfo:
    title: str
    profile: str
    attendees: list[str]
    consent: bool
    stereo: bool
    started_at: str  # ISO 8601
    meeting_id: str | None = None

    def save(self, folder: Path) -> None:
        (folder / "recording.json").write_text(json.dumps(asdict(self), indent=2), encoding="utf-8")

    @classmethod
    def load(cls, folder: Path) -> RecordingInfo:
        return cls(**json.loads((folder / "recording.json").read_text(encoding="utf-8")))


class RecordingSession:
    def __init__(self, root: Path, capture_cls: type[Capture], info: RecordingInfo):
        self.info = info
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self.folder = root / stamp
        self.folder.mkdir(parents=True, exist_ok=False)
        self.capture = capture_cls(self.folder, with_meeting_audio=info.stereo)
        self.info.save(self.folder)

    def start(self) -> None:
        self.capture.start()

    def stop(self) -> Path:
        """Stop capture and produce the FLAC to upload."""
        self.capture.stop()
        out = self.folder / "recording.flac"
        mixdown(self.capture.mic_path, self.capture.meeting_path, out)
        for p in (self.capture.mic_path, self.capture.meeting_path):
            if p is not None:
                p.unlink(missing_ok=True)
        return out


def upload_recording(folder: Path, client: ApiClient, on_progress=None) -> str:
    """Create the meeting (once) and upload. Returns the meeting id and removes the local copy."""
    info = RecordingInfo.load(folder)
    flac = folder / "recording.flac"
    if not flac.exists():
        raise FileNotFoundError(f"{flac} is missing")
    if not info.meeting_id:
        meeting = client.create_meeting(
            title=info.title,
            profile=info.profile,
            started_at=datetime.fromisoformat(info.started_at),
            attendees=info.attendees,
            stereo=info.stereo,
            consent=info.consent,
        )
        info.meeting_id = meeting["id"]
        info.save(folder)  # a retry reuses the same meeting
    client.upload(info.meeting_id, flac, on_progress)
    shutil.rmtree(folder, ignore_errors=True)
    return info.meeting_id


def pending_recordings(root: Path) -> list[Path]:
    """Finished recordings that have not been uploaded yet, oldest first."""
    return sorted(p for p in root.iterdir() if (p / "recording.flac").exists() and (p / "recording.json").exists())


def recover_interrupted(root: Path) -> list[Path]:
    """Recordings whose app closed mid-meeting still have mic.raw/meeting.raw; finish their mixdown."""
    recovered = []
    for folder in sorted(root.iterdir()):
        mic = folder / "mic.raw"
        if (folder / "recording.json").exists() and mic.exists() and not (folder / "recording.flac").exists():
            meeting = folder / "meeting.raw"
            try:
                mixdown(mic, meeting if meeting.exists() else None, folder / "recording.flac")
            except Exception:
                continue  # unreadable partial file; leave it for manual recovery
            mic.unlink(missing_ok=True)
            meeting.unlink(missing_ok=True)
            recovered.append(folder)
    return recovered


def now_iso() -> str:
    return datetime.now(UTC).isoformat()
