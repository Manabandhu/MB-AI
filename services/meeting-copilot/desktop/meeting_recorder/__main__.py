"""Entry point: `python -m meeting_recorder` (or MeetingRecorder.exe).

--fake-audio   use generated test tones instead of real devices (works on any OS)
"""

import sys


def main() -> None:
    from .capture import FakeCapture, WindowsCapture
    from .ui import run

    fake = "--fake-audio" in sys.argv or sys.platform != "win32"
    if sys.platform != "win32" and "--fake-audio" not in sys.argv:
        print("Real capture is Windows-only; starting with test tones (--fake-audio).", file=sys.stderr)
    run(FakeCapture if fake else WindowsCapture)


if __name__ == "__main__":
    main()
