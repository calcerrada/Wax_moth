from pathlib import Path

from services.file_service import delete_audio_files
from state import scan_state


def test_delete_audio_files_removes_file_and_updates_state(tmp_path):
    target = tmp_path / "song.mp3"
    target.write_bytes(b"fake-mp3")

    scan_state["files"] = [
        {"path": str(target), "filename": "song.mp3"},
        {"path": "other.mp3", "filename": "other.mp3"},
    ]
    scan_state["duplicates"] = [
        {
            "fingerprint": "abc",
            "files": [
                {"path": str(target), "filename": "song.mp3"},
                {"path": "other.mp3", "filename": "other.mp3"},
            ],
        }
    ]

    deleted, failed = delete_audio_files([str(target)])

    assert deleted == [str(target)]
    assert failed == []
    assert not target.exists()
    assert all(entry["path"] != str(target) for entry in scan_state["files"])


def test_delete_audio_files_rejects_non_audio_extension(tmp_path):
    target = tmp_path / "notes.txt"
    target.write_text("not audio", encoding="utf-8")

    deleted, failed = delete_audio_files([str(target)])

    assert deleted == []
    assert len(failed) == 1
    assert failed[0]["path"] == str(target)
    assert "Extension no permitida" in failed[0]["error"]
