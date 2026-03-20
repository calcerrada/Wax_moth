from fastapi import APIRouter, BackgroundTasks, HTTPException

from schemas import (
    AudioFile,
    DeleteRequest,
    DeleteResult,
    DuplicateGroup,
    EngineDJConfigRequest,
    EngineDJLibraryResult,
    EngineDJStatus,
    ScanRequest,
    ScanResult,
)
from services.audio_service import find_fpcalc
from services.engine_dj_service import (
    EngineDJLockedError,
    EngineDJSchemaError,
    clear_engine_db_path,
    find_engine_db,
    get_engine_dj_status,
    read_engine_library,
    save_engine_db_path,
)
from services.file_service import delete_audio_files
from services.scan_service import scan_folder
from state import reset_scan_state, scan_state

router = APIRouter()


@router.get("/health")
def health():
    fpcalc = find_fpcalc()
    return {
        "status": "ok",
        "fpcalc_available": fpcalc is not None,
        "fpcalc_path": str(fpcalc) if fpcalc else None,
    }


@router.post("/scan")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    if scan_state["status"] == "scanning":
        raise HTTPException(status_code=409, detail="Ya hay un escaneo en curso.")

    background_tasks.add_task(scan_folder, request.folder, request.detect_duplicates)
    return {"message": "Escaneo iniciado", "folder": request.folder}


@router.get("/scan/status")
def get_scan_status():
    return {
        "status": scan_state["status"],
        "progress": scan_state["progress"],
        "total": scan_state["total"],
        "error": scan_state["error"],
    }


@router.get("/scan/results", response_model=ScanResult)
def get_scan_results():
    if scan_state["status"] == "idle":
        raise HTTPException(status_code=404, detail="No hay ningun escaneo previo.")
    if scan_state["status"] == "scanning":
        raise HTTPException(status_code=202, detail="El escaneo todavia esta en curso.")
    if scan_state["status"] == "error":
        raise HTTPException(status_code=500, detail=scan_state["error"])

    return ScanResult(
        status=scan_state["status"],
        total_files=len(scan_state["files"]),
        files=[AudioFile(**f) for f in scan_state["files"]],
        duplicate_groups=[DuplicateGroup(**g) for g in scan_state["duplicates"]],
    )


@router.delete("/scan/reset")
def reset_scan():
    reset_scan_state()
    return {"message": "Estado reseteado."}


@router.delete("/files", response_model=DeleteResult)
def delete_files(request: DeleteRequest):
    if not request.paths:
        raise HTTPException(status_code=400, detail="La lista de rutas esta vacia.")

    deleted, failed = delete_audio_files(request.paths)
    return DeleteResult(deleted=deleted, failed=failed)


@router.get("/engine-dj/status", response_model=EngineDJStatus)
def get_engine_dj_connection_status():
    """Returns Engine DJ library discovery status and any lookup error."""
    try:
        db_path = find_engine_db()
        status = get_engine_dj_status(db_path)
        return EngineDJStatus(**status)
    except Exception as exc:
        return EngineDJStatus(found=False, path=None, error=str(exc))


@router.post("/engine-dj/config")
def save_engine_dj_config(request: EngineDJConfigRequest):
    """Saves a user-defined Engine DJ database path."""
    try:
        save_engine_db_path(request.db_path)
        return {"message": "Engine DJ library path saved", "path": request.db_path}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save Engine DJ config: {exc}") from exc


@router.delete("/engine-dj/config")
def clear_engine_dj_config():
    """Clears persisted Engine DJ database path configuration."""
    try:
        clear_engine_db_path()
        return {"message": "Engine DJ configuration cleared"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to clear Engine DJ config: {exc}") from exc


@router.get("/engine-dj/library", response_model=EngineDJLibraryResult)
def get_engine_dj_library():
    """Reads Engine DJ playlists/crates assignments for tracks."""
    try:
        db_path = find_engine_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to find Engine DJ library: {exc}") from exc

    if db_path is None:
        raise HTTPException(
            status_code=404,
            detail="Engine DJ library not found. Configure the path first.",
        )

    try:
        tracks = read_engine_library(db_path)
        return EngineDJLibraryResult(
            tracks=tracks,
            total_tracks_in_library=len(tracks),
            total_tracks_with_collections=sum(1 for collections in tracks.values() if collections),
        )
    except EngineDJLockedError as exc:
        raise HTTPException(
            status_code=423,
            detail="Engine DJ database is locked. Close Engine DJ and try again.",
        ) from exc
    except EngineDJSchemaError as exc:
        raise HTTPException(
            status_code=422,
            detail="Engine DJ database schema not recognized. Check your Engine DJ version.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read Engine DJ library: {exc}") from exc
