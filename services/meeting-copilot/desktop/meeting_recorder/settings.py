"""Where the recorder keeps its settings and unsent recordings.

Windows: %APPDATA%\\MeetingCopilot\\settings.json and %LOCALAPPDATA%\\MeetingCopilot\\recordings.
The access token goes to Windows Credential Manager (via keyring) when available.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path

KEYRING_SERVICE = "MeetingCopilot"


def _base(var: str, fallback: str) -> Path:
    root = os.environ.get(var)
    return Path(root) if root else Path.home() / fallback


def config_dir() -> Path:
    return _base("APPDATA", ".config") / "MeetingCopilot"


def recordings_dir() -> Path:
    path = _base("LOCALAPPDATA", ".local/share") / "MeetingCopilot" / "recordings"
    path.mkdir(parents=True, exist_ok=True)
    return path


@dataclass
class Settings:
    server_url: str = "http://localhost:8000"
    verify_tls: bool = True
    profile: str = "standup"
    default_attendees: list[str] = field(default_factory=list)

    @classmethod
    def load(cls) -> Settings:
        path = config_dir() / "settings.json"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        except (OSError, ValueError, TypeError):
            return cls()

    def save(self) -> None:
        path = config_dir() / "settings.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(asdict(self), indent=2), encoding="utf-8")


def load_token(server_url: str) -> str:
    try:
        import keyring

        return keyring.get_password(KEYRING_SERVICE, server_url) or ""
    except Exception:
        path = config_dir() / "token"
        return path.read_text(encoding="utf-8").strip() if path.exists() else ""


def save_token(server_url: str, token: str) -> None:
    try:
        import keyring

        keyring.set_password(KEYRING_SERVICE, server_url, token)
    except Exception:
        # No credential store available: fall back to a file only the current user can read.
        path = config_dir() / "token"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(token, encoding="utf-8")
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
