def _default_scan_state() -> dict:
    return {
        "status": "idle",
        "progress": 0,
        "total": 0,
        "files": [],
        "duplicates": [],
        "error": None,
    }


scan_state: dict = _default_scan_state()


def reset_scan_state() -> None:
    scan_state.clear()
    scan_state.update(_default_scan_state())
