from pathlib import Path

from config import AUDIO_EXTENSIONS
from state import scan_state


def delete_audio_files(paths: list[str]) -> tuple[list[str], list[dict]]:
    deleted: list[str] = []
    failed: list[dict] = []

    for raw_path in paths:
        file_path = Path(raw_path)
        try:
            if not file_path.exists():
                raise FileNotFoundError("El archivo no existe.")
            if not file_path.is_file():
                raise ValueError("La ruta no es un archivo.")
            if file_path.suffix.lower() not in AUDIO_EXTENSIONS:
                raise ValueError(f"Extension no permitida: {file_path.suffix}")

            file_path.unlink()
            deleted_path = str(file_path)
            deleted.append(deleted_path)

            scan_state["files"] = [
                f for f in scan_state["files"] if f["path"] != deleted_path
            ]
            for group in scan_state["duplicates"]:
                group["files"] = [
                    f for f in group["files"] if f["path"] != deleted_path
                ]
            scan_state["duplicates"] = [
                g for g in scan_state["duplicates"] if len(g["files"]) > 1
            ]
        except Exception as exc:
            failed.append({"path": str(file_path), "error": str(exc)})

    return deleted, failed
