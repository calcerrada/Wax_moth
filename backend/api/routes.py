from fastapi import APIRouter, BackgroundTasks, HTTPException

from schemas import (
    AudioFile,
    DeleteRequest,
    DeleteResult,
    DuplicateGroup,
    ScanRequest,
    ScanResult,
)
from services.audio_service import find_fpcalc
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
