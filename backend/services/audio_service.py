import hashlib
import subprocess
from pathlib import Path
from typing import Optional

from mutagen.aiff import AIFF
from mutagen.flac import FLAC
from mutagen.mp3 import MP3
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE

from config import EXT_QUALITY_RANK, FPCALC_PATHS
from schemas import AudioFile


def find_fpcalc() -> Optional[Path]:
    for p in FPCALC_PATHS:
        resolved = Path(p)
        if resolved.exists():
            return resolved

    # Try shell lookup as fallback.
    for cmd in (["which", "fpcalc"], ["where", "fpcalc"]):
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if result.returncode == 0 and result.stdout.strip():
                first_match = result.stdout.splitlines()[0].strip()
                return Path(first_match)
        except Exception:
            pass

    return None


def get_fingerprint(file_path: Path, fpcalc: Path) -> Optional[str]:
    try:
        result = subprocess.run(
            [str(fpcalc), "-raw", str(file_path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            return None

        for line in result.stdout.splitlines():
            if line.startswith("FINGERPRINT="):
                raw = line.split("=", 1)[1].strip()
                return hashlib.md5(raw.encode()).hexdigest()
        return None
    except Exception:
        return None


def read_metadata(file_path: Path) -> dict:
    ext = file_path.suffix.lower()
    meta = {
        "title": None,
        "artist": None,
        "album": None,
        "year": None,
        "duration_seconds": None,
        "bitrate": None,
    }

    try:
        if ext == ".mp3":
            audio = MP3(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
            meta["bitrate"] = getattr(audio.info, "bitrate", None)
            tags = audio.tags
            if tags:
                meta["title"] = str(tags.get("TIT2", "")).strip() or None
                meta["artist"] = str(tags.get("TPE1", "")).strip() or None
                meta["album"] = str(tags.get("TALB", "")).strip() or None
                meta["year"] = str(tags.get("TDRC", "")).strip() or None
        elif ext == ".flac":
            audio = FLAC(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
            meta["bitrate"] = getattr(audio.info, "bitrate", None)
            meta["title"] = (audio.get("title") or [None])[0]
            meta["artist"] = (audio.get("artist") or [None])[0]
            meta["album"] = (audio.get("album") or [None])[0]
            meta["year"] = (audio.get("date") or [None])[0]
        elif ext == ".wav":
            audio = WAVE(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
        elif ext in (".aiff", ".aif"):
            audio = AIFF(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
        elif ext == ".ogg":
            audio = OggVorbis(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
            meta["bitrate"] = getattr(audio.info, "bitrate", None)
            meta["title"] = (audio.get("title") or [None])[0]
            meta["artist"] = (audio.get("artist") or [None])[0]
            meta["album"] = (audio.get("album") or [None])[0]
            meta["year"] = (audio.get("date") or [None])[0]
    except Exception:
        pass

    return meta


def compute_quality_score(file: AudioFile) -> int:
    bitrate_score = (file.bitrate or 0) * 1000
    ext_score = EXT_QUALITY_RANK.get(file.extension, 0) * 100
    size_score = min(file.size_bytes // 10000, 99)
    return bitrate_score + ext_score + size_score


def sort_by_quality(files: list[AudioFile]) -> list[AudioFile]:
    return sorted(files, key=compute_quality_score, reverse=True)
