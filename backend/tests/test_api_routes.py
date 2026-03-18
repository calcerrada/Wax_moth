from pathlib import Path

import api.routes as routes
from state import scan_state


def test_health_reports_fpcalc_available(client, monkeypatch):
    monkeypatch.setattr(routes, "find_fpcalc", lambda: Path("fpcalc"))

    res = client.get("/health")

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["fpcalc_available"] is True


def test_start_scan_returns_409_when_scan_running(client):
    scan_state["status"] = "scanning"

    res = client.post("/scan", json={"folder": "C:/music", "detect_duplicates": True})

    assert res.status_code == 409


def test_get_scan_results_returns_404_when_idle(client):
    res = client.get("/scan/results")

    assert res.status_code == 404


def test_get_scan_results_returns_data_when_done(client):
    sample_file = {
        "path": "C:/music/song.mp3",
        "filename": "song.mp3",
        "extension": ".mp3",
        "size_bytes": 1234,
        "duration_seconds": 12.3,
        "title": None,
        "artist": None,
        "album": None,
        "year": None,
        "bitrate": 192000,
        "fingerprint": None,
        "quality_score": 192000100,
    }
    scan_state.update(
        {
            "status": "done",
            "files": [sample_file],
            "duplicates": [],
        }
    )

    res = client.get("/scan/results")

    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "done"
    assert payload["total_files"] == 1
    assert payload["files"][0]["filename"] == "song.mp3"


def test_delete_files_returns_400_for_empty_payload(client):
    res = client.request("DELETE", "/files", json={"paths": []})

    assert res.status_code == 400


def test_delete_files_endpoint_deletes_audio_file(client, tmp_path):
    target = tmp_path / "to_delete.mp3"
    target.write_bytes(b"audio")

    scan_state["files"] = [{"path": str(target), "filename": "to_delete.mp3"}]
    scan_state["duplicates"] = []

    res = client.request("DELETE", "/files", json={"paths": [str(target)]})

    assert res.status_code == 200
    payload = res.json()
    assert payload["deleted"] == [str(target)]
    assert payload["failed"] == []
