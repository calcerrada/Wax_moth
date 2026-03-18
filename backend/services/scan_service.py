from collections import defaultdict
from pathlib import Path

from config import AUDIO_EXTENSIONS
from schemas import AudioFile, DuplicateGroup
from services.audio_service import (
    compute_quality_score,
    find_fpcalc,
    get_fingerprint,
    read_metadata,
    sort_by_quality,
)
from state import scan_state


def scan_folder(folder: str, detect_duplicates: bool) -> None:
    scan_state.update(
        {
            "status": "scanning",
            "progress": 0,
            "files": [],
            "duplicates": [],
            "error": None,
        }
    )

    root = Path(folder)
    if not root.exists() or not root.is_dir():
        scan_state["status"] = "error"
        scan_state["error"] = f"La carpeta no existe: {folder}"
        return

    audio_files: list[Path] = []
    for ext in AUDIO_EXTENSIONS:
        audio_files.extend(root.rglob(f"*{ext}"))
        audio_files.extend(root.rglob(f"*{ext.upper()}"))

    seen, unique = set(), []
    for file_path in audio_files:
        resolved = str(file_path.resolve())
        if resolved not in seen:
            seen.add(resolved)
            unique.append(file_path)

    audio_files = sorted(unique)
    total = len(audio_files)
    scan_state["total"] = total

    if total == 0:
        scan_state["status"] = "done"
        return

    fpcalc = find_fpcalc() if detect_duplicates else None
    fingerprint_map: dict[str, list[AudioFile]] = defaultdict(list)
    results: list[AudioFile] = []

    for i, file_path in enumerate(audio_files):
        scan_state["progress"] = i + 1
        try:
            size = file_path.stat().st_size
        except OSError:
            continue

        meta = read_metadata(file_path)
        fingerprint = get_fingerprint(file_path, fpcalc) if fpcalc else None

        audio_file = AudioFile(
            path=str(file_path.resolve()),
            filename=file_path.name,
            extension=file_path.suffix.lower(),
            size_bytes=size,
            duration_seconds=meta["duration_seconds"],
            title=meta["title"],
            artist=meta["artist"],
            album=meta["album"],
            year=meta["year"],
            bitrate=meta["bitrate"],
            fingerprint=fingerprint,
        )
        audio_file.quality_score = compute_quality_score(audio_file)
        results.append(audio_file)

        if fingerprint:
            fingerprint_map[fingerprint].append(audio_file)

    duplicate_groups = [
        DuplicateGroup(fingerprint=fp, files=sort_by_quality(files))
        for fp, files in fingerprint_map.items()
        if len(files) > 1
    ]

    scan_state["files"] = [f.model_dump() for f in results]
    scan_state["duplicates"] = [g.model_dump() for g in duplicate_groups]
    scan_state["status"] = "done"
