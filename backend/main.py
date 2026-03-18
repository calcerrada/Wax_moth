"""
Audio Manager — FastAPI Backend
Escanea carpetas de audio, lee metadatos y detecta duplicados por huella acústica (Chromaprint/fpcalc).
"""

import os
import sys
import subprocess
import hashlib
from pathlib import Path
from collections import defaultdict
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mutagen
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.wave import WAVE
from mutagen.aiff import AIFF
from mutagen.oggvorbis import OggVorbis
from mutagen.id3 import ID3NoHeaderError

# ─── Configuración ────────────────────────────────────────────────────────────

# Ruta a fpcalc. Busca primero en ./bin, luego en PATH del sistema.
FPCALC_PATHS = [
    Path(__file__).parent / "bin" / "fpcalc",        # Linux/Mac
    Path(__file__).parent / "bin" / "fpcalc.exe",    # Windows
    Path("fpcalc"),                                   # Sistema PATH
]

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aiff", ".aif", ".ogg"}

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Audio Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado en memoria del último escaneo (simple, sin base de datos)
scan_state: dict = {
    "status": "idle",        # idle | scanning | done | error
    "progress": 0,
    "total": 0,
    "files": [],
    "duplicates": [],
    "error": None,
}

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    folder: str
    detect_duplicates: bool = True


class AudioFile(BaseModel):
    path: str
    filename: str
    extension: str
    size_bytes: int
    duration_seconds: Optional[float]
    title: Optional[str]
    artist: Optional[str]
    album: Optional[str]
    year: Optional[str]
    bitrate: Optional[int]
    fingerprint: Optional[str]


class DuplicateGroup(BaseModel):
    fingerprint: str
    files: list[AudioFile]


class ScanResult(BaseModel):
    status: str
    total_files: int
    files: list[AudioFile]
    duplicate_groups: list[DuplicateGroup]


# ─── Utilidades ───────────────────────────────────────────────────────────────

def find_fpcalc() -> Optional[Path]:
    """Devuelve la ruta a fpcalc si está disponible, o None."""
    for p in FPCALC_PATHS:
        resolved = Path(p)
        if resolved.exists():
            return resolved
    # Intentar via which/where en el sistema
    try:
        result = subprocess.run(
            ["which", "fpcalc"], capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0 and result.stdout.strip():
            return Path(result.stdout.strip())
    except Exception:
        pass
    return None


def get_fingerprint(file_path: Path, fpcalc: Path) -> Optional[str]:
    """
    Genera la huella acústica de un archivo usando fpcalc.
    Devuelve el fingerprint como string o None si falla.
    """
    try:
        result = subprocess.run(
            [str(fpcalc), "-raw", str(file_path)],
            capture_output=True,
            text=True,
            timeout=30,  # archivos grandes pueden tardar
        )
        if result.returncode != 0:
            return None

        # La salida de fpcalc -raw tiene formato:
        # DURATION=123
        # FINGERPRINT=12345,67890,...
        for line in result.stdout.splitlines():
            if line.startswith("FINGERPRINT="):
                raw = line.split("=", 1)[1].strip()
                # Hasheamos el fingerprint completo para comparación eficiente
                return hashlib.md5(raw.encode()).hexdigest()
        return None
    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None


def read_metadata(file_path: Path) -> dict:
    """Lee metadatos (título, artista, álbum, duración, bitrate) con mutagen."""
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
        audio = None

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
        pass  # Si falla, devolvemos los campos vacíos

    return meta


def scan_folder(folder: str, detect_duplicates: bool) -> None:
    """
    Escaneo recursivo en background.
    Actualiza scan_state globalmente mientras avanza.
    """
    global scan_state

    scan_state["status"] = "scanning"
    scan_state["progress"] = 0
    scan_state["files"] = []
    scan_state["duplicates"] = []
    scan_state["error"] = None

    root = Path(folder)
    if not root.exists() or not root.is_dir():
        scan_state["status"] = "error"
        scan_state["error"] = f"La carpeta no existe: {folder}"
        return

    # 1. Recolectar todos los archivos de audio
    audio_files: list[Path] = []
    for ext in AUDIO_EXTENSIONS:
        audio_files.extend(root.rglob(f"*{ext}"))
        audio_files.extend(root.rglob(f"*{ext.upper()}"))

    # Eliminar duplicados de path (por case-insensitive en algunos FS)
    seen_paths = set()
    unique_files = []
    for f in audio_files:
        resolved = str(f.resolve())
        if resolved not in seen_paths:
            seen_paths.add(resolved)
            unique_files.append(f)

    audio_files = sorted(unique_files)
    total = len(audio_files)
    scan_state["total"] = total

    if total == 0:
        scan_state["status"] = "done"
        return

    # 2. Detectar fpcalc
    fpcalc = find_fpcalc() if detect_duplicates else None
    fingerprint_map: dict[str, list[AudioFile]] = defaultdict(list)

    # 3. Procesar cada archivo
    results: list[AudioFile] = []
    for i, file_path in enumerate(audio_files):
        scan_state["progress"] = i + 1

        try:
            size = file_path.stat().st_size
        except OSError:
            continue

        meta = read_metadata(file_path)
        fingerprint = None

        if fpcalc:
            fingerprint = get_fingerprint(file_path, fpcalc)

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

        results.append(audio_file)

        if fingerprint:
            fingerprint_map[fingerprint].append(audio_file)

    # 4. Agrupar duplicados (grupos con más de 1 archivo)
    duplicate_groups = [
        DuplicateGroup(fingerprint=fp, files=files)
        for fp, files in fingerprint_map.items()
        if len(files) > 1
    ]

    scan_state["files"] = [f.model_dump() for f in results]
    scan_state["duplicates"] = [g.model_dump() for g in duplicate_groups]
    scan_state["status"] = "done"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Comprueba que el servidor está vivo."""
    fpcalc = find_fpcalc()
    return {
        "status": "ok",
        "fpcalc_available": fpcalc is not None,
        "fpcalc_path": str(fpcalc) if fpcalc else None,
    }


@app.post("/scan")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Inicia un escaneo en background.
    Devuelve inmediatamente con status 'scanning'.
    El cliente puede sondear /scan/status para ver el progreso.
    """
    if scan_state["status"] == "scanning":
        raise HTTPException(status_code=409, detail="Ya hay un escaneo en curso.")

    background_tasks.add_task(
        scan_folder, request.folder, request.detect_duplicates
    )

    return {"message": "Escaneo iniciado", "folder": request.folder}


@app.get("/scan/status")
def get_scan_status():
    """Devuelve el progreso actual del escaneo."""
    return {
        "status": scan_state["status"],
        "progress": scan_state["progress"],
        "total": scan_state["total"],
        "error": scan_state["error"],
    }


@app.get("/scan/results", response_model=ScanResult)
def get_scan_results():
    """
    Devuelve los resultados completos del último escaneo.
    Llámalo cuando /scan/status devuelva status='done'.
    """
    if scan_state["status"] == "idle":
        raise HTTPException(status_code=404, detail="No hay ningún escaneo previo.")
    if scan_state["status"] == "scanning":
        raise HTTPException(status_code=202, detail="El escaneo todavía está en curso.")
    if scan_state["status"] == "error":
        raise HTTPException(status_code=500, detail=scan_state["error"])

    return ScanResult(
        status=scan_state["status"],
        total_files=len(scan_state["files"]),
        files=[AudioFile(**f) for f in scan_state["files"]],
        duplicate_groups=[
            DuplicateGroup(**g) for g in scan_state["duplicates"]
        ],
    )


@app.delete("/scan/reset")
def reset_scan():
    """Limpia el estado del escaneo anterior."""
    global scan_state
    scan_state = {
        "status": "idle",
        "progress": 0,
        "total": 0,
        "files": [],
        "duplicates": [],
        "error": None,
    }
    return {"message": "Estado reseteado."}
