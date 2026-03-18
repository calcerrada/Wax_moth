"""
Audio Manager — FastAPI Backend
Escanea carpetas de audio, lee metadatos y detecta duplicados por huella acústica (Chromaprint).
"""

import subprocess
import hashlib
from pathlib import Path
from collections import defaultdict
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.wave import WAVE
from mutagen.aiff import AIFF
from mutagen.oggvorbis import OggVorbis

# ─── Configuración ────────────────────────────────────────────────────────────

FPCALC_PATHS = [
    Path(__file__).parent / "bin" / "fpcalc",
    Path(__file__).parent / "bin" / "fpcalc.exe",
    Path("fpcalc"),
]

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aiff", ".aif", ".ogg"}

# Mayor índice = mayor calidad base por formato
EXT_QUALITY_RANK = {
    ".ogg": 1,
    ".mp3": 2,
    ".aiff": 3,
    ".aif": 3,
    ".wav": 4,
    ".flac": 5,
}

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Audio Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scan_state: dict = {
    "status": "idle",
    "progress": 0,
    "total": 0,
    "files": [],
    "duplicates": [],
    "error": None,
}

# ─── Modelos ──────────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    folder: str
    detect_duplicates: bool = True


class DeleteRequest(BaseModel):
    paths: list[str]


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
    quality_score: Optional[int] = None


class DuplicateGroup(BaseModel):
    fingerprint: str
    files: list[AudioFile]   # ordenadas mayor → menor calidad


class ScanResult(BaseModel):
    status: str
    total_files: int
    files: list[AudioFile]
    duplicate_groups: list[DuplicateGroup]


class DeleteResult(BaseModel):
    deleted: list[str]
    failed: list[dict]       # {"path": ..., "error": ...}


# ─── Utilidades ───────────────────────────────────────────────────────────────

def find_fpcalc() -> Optional[Path]:
    for p in FPCALC_PATHS:
        resolved = Path(p)
        if resolved.exists():
            return resolved
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
    try:
        result = subprocess.run(
            [str(fpcalc), "-raw", str(file_path)],
            capture_output=True, text=True, timeout=30,
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
        "title": None, "artist": None, "album": None,
        "year": None, "duration_seconds": None, "bitrate": None,
    }
    try:
        if ext == ".mp3":
            audio = MP3(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
            meta["bitrate"] = getattr(audio.info, "bitrate", None)
            tags = audio.tags
            if tags:
                meta["title"]  = str(tags.get("TIT2", "")).strip() or None
                meta["artist"] = str(tags.get("TPE1", "")).strip() or None
                meta["album"]  = str(tags.get("TALB", "")).strip() or None
                meta["year"]   = str(tags.get("TDRC", "")).strip() or None
        elif ext == ".flac":
            audio = FLAC(file_path)
            meta["duration_seconds"] = round(audio.info.length, 2)
            meta["bitrate"] = getattr(audio.info, "bitrate", None)
            meta["title"]  = (audio.get("title")  or [None])[0]
            meta["artist"] = (audio.get("artist") or [None])[0]
            meta["album"]  = (audio.get("album")  or [None])[0]
            meta["year"]   = (audio.get("date")   or [None])[0]
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
            meta["title"]  = (audio.get("title")  or [None])[0]
            meta["artist"] = (audio.get("artist") or [None])[0]
            meta["album"]  = (audio.get("album")  or [None])[0]
            meta["year"]   = (audio.get("date")   or [None])[0]
    except Exception:
        pass
    return meta


def compute_quality_score(file: AudioFile) -> int:
    """
    Puntuación de calidad (mayor = mejor).
      1. Bitrate  → peso principal
      2. Formato  → FLAC > WAV > AIFF > MP3 > OGG
      3. Tamaño   → desempate final
    """
    bitrate_score = (file.bitrate or 0) * 1000
    ext_score     = EXT_QUALITY_RANK.get(file.extension, 0) * 100
    size_score    = min(file.size_bytes // 10000, 99)
    return bitrate_score + ext_score + size_score


def sort_by_quality(files: list[AudioFile]) -> list[AudioFile]:
    return sorted(files, key=compute_quality_score, reverse=True)


def scan_folder(folder: str, detect_duplicates: bool) -> None:
    global scan_state
    scan_state.update({
        "status": "scanning", "progress": 0,
        "files": [], "duplicates": [], "error": None,
    })

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
    for f in audio_files:
        r = str(f.resolve())
        if r not in seen:
            seen.add(r)
            unique.append(f)

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

        af = AudioFile(
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
        af.quality_score = compute_quality_score(af)
        results.append(af)

        if fingerprint:
            fingerprint_map[fingerprint].append(af)

    duplicate_groups = [
        DuplicateGroup(fingerprint=fp, files=sort_by_quality(files))
        for fp, files in fingerprint_map.items()
        if len(files) > 1
    ]

    scan_state["files"]      = [f.model_dump() for f in results]
    scan_state["duplicates"] = [g.model_dump() for g in duplicate_groups]
    scan_state["status"]     = "done"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    fpcalc = find_fpcalc()
    return {
        "status": "ok",
        "fpcalc_available": fpcalc is not None,
        "fpcalc_path": str(fpcalc) if fpcalc else None,
    }


@app.post("/scan")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    if scan_state["status"] == "scanning":
        raise HTTPException(status_code=409, detail="Ya hay un escaneo en curso.")
    background_tasks.add_task(scan_folder, request.folder, request.detect_duplicates)
    return {"message": "Escaneo iniciado", "folder": request.folder}


@app.get("/scan/status")
def get_scan_status():
    return {
        "status":   scan_state["status"],
        "progress": scan_state["progress"],
        "total":    scan_state["total"],
        "error":    scan_state["error"],
    }


@app.get("/scan/results", response_model=ScanResult)
def get_scan_results():
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
        duplicate_groups=[DuplicateGroup(**g) for g in scan_state["duplicates"]],
    )


@app.delete("/scan/reset")
def reset_scan():
    global scan_state
    scan_state = {
        "status": "idle", "progress": 0, "total": 0,
        "files": [], "duplicates": [], "error": None,
    }
    return {"message": "Estado reseteado."}


@app.delete("/files", response_model=DeleteResult)
def delete_files(request: DeleteRequest):
    """
    Borra permanentemente los archivos de la lista.
    Solo permite extensiones de audio conocidas como medida de seguridad.
    Actualiza el estado en memoria para reflejar los borrados sin re-escanear.
    """
    if not request.paths:
        raise HTTPException(status_code=400, detail="La lista de rutas está vacía.")

    deleted, failed = [], []

    for raw_path in request.paths:
        p = Path(raw_path)
        try:
            if not p.exists():
                raise FileNotFoundError("El archivo no existe.")
            if not p.is_file():
                raise ValueError("La ruta no es un archivo.")
            if p.suffix.lower() not in AUDIO_EXTENSIONS:
                raise ValueError(f"Extensión no permitida: {p.suffix}")
            p.unlink()
            deleted.append(str(p))

            # Actualizar estado en memoria
            scan_state["files"] = [
                f for f in scan_state["files"] if f["path"] != str(p)
            ]
            for group in scan_state["duplicates"]:
                group["files"] = [
                    f for f in group["files"] if f["path"] != str(p)
                ]
            # Eliminar grupos que ya no tienen duplicados reales (< 2 archivos)
            scan_state["duplicates"] = [
                g for g in scan_state["duplicates"] if len(g["files"]) > 1
            ]

        except Exception as e:
            failed.append({"path": str(p), "error": str(e)})

    return DeleteResult(deleted=deleted, failed=failed)
