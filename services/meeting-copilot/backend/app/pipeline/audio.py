"""Audio plumbing: normalize any upload with ffmpeg, split stereo channels, measure loudness."""

import json
import math
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

SAMPLE_RATE = 16_000
BLOCK = SAMPLE_RATE * 10  # stream audio in 10-second blocks so hour-long files stay out of RAM


class AudioError(RuntimeError):
    pass


def _run(cmd: list[str]) -> str:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise AudioError(f"{cmd[0]} failed: {proc.stderr.strip()[-500:]}")
    return proc.stdout


def source_channels(path: Path) -> int:
    out = _run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=channels",
            "-of",
            "json",
            str(path),
        ]
    )
    streams = json.loads(out).get("streams") or []
    if not streams:
        raise AudioError("no audio stream found in the upload")
    return int(streams[0].get("channels") or 1)


def normalize(src: Path, dst: Path, channels: int) -> float:
    """Convert to 16 kHz 16-bit PCM WAV with the given channel count. Returns duration in seconds."""
    _run(
        [
            "ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(src),
            "-vn", "-ac", str(channels), "-ar", str(SAMPLE_RATE), "-c:a", "pcm_s16le", str(dst),
        ]
    )  # fmt: skip
    info = sf.info(str(dst))
    return info.frames / info.samplerate


def make_playback(src_wav: Path, dst_m4a: Path) -> None:
    """Small mono AAC copy for the in-app player (about 20 MB per hour)."""
    _run(
        [
            "ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(src_wav),
            "-ac", "1", "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", str(dst_m4a),
        ]
    )  # fmt: skip


def split_stereo(src: Path, left: Path, right: Path) -> None:
    info = sf.info(str(src))
    if info.channels != 2:
        raise AudioError(f"expected 2 channels, got {info.channels}")
    with (
        sf.SoundFile(str(left), "w", samplerate=info.samplerate, channels=1, subtype="PCM_16") as lf,
        sf.SoundFile(str(right), "w", samplerate=info.samplerate, channels=1, subtype="PCM_16") as rf,
    ):
        for block in sf.blocks(str(src), blocksize=BLOCK, dtype="int16", always_2d=True):
            lf.write(block[:, 0])
            rf.write(block[:, 1])


def rms_dbfs(path: Path) -> float:
    """Loudness of the whole file in dBFS. Silence is around -90; speech is usually above -45."""
    total, count = 0.0, 0
    for block in sf.blocks(str(path), blocksize=BLOCK, dtype="float32", always_2d=True):
        total += float(np.square(block, dtype=np.float64).sum())
        count += block.size
    if count == 0 or total == 0:
        return -120.0
    return 10 * math.log10(total / count)
