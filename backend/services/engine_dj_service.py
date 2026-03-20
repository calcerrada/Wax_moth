import json
import sqlite3
from pathlib import Path

from config import ENGINE_DJ_CONFIG_PATH, ENGINE_DJ_DEFAULT_PATHS


class EngineDJLockedError(Exception):
    pass


class EngineDJSchemaError(Exception):
    pass


def find_engine_db() -> Path | None:
    if ENGINE_DJ_CONFIG_PATH.exists():
        try:
            payload = json.loads(ENGINE_DJ_CONFIG_PATH.read_text(encoding="utf-8"))
            configured_path = payload.get("engine_db_path")
            if isinstance(configured_path, str):
                candidate = Path(configured_path).expanduser()
                if candidate.exists() and candidate.is_file():
                    return candidate
        except Exception as exc:
            raise ValueError(
                f"Failed to read Engine DJ config at {ENGINE_DJ_CONFIG_PATH}: {exc}"
            ) from exc

    for candidate in ENGINE_DJ_DEFAULT_PATHS:
        resolved = Path(candidate).expanduser()
        if resolved.exists() and resolved.is_file():
            return resolved

    return None


def save_engine_db_path(path: str) -> None:
    candidate = Path(path).expanduser()
    if not candidate.exists() or not candidate.is_file():
        raise ValueError(f"Invalid Engine DJ database path (file not found): {path}")
    if candidate.suffix.lower() != ".db":
        raise ValueError(f"Invalid Engine DJ database path (expected .db file): {path}")

    payload = {"engine_db_path": str(candidate.resolve())}
    try:
        ENGINE_DJ_CONFIG_PATH.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception as exc:
        raise ValueError(
            f"Failed to persist Engine DJ config at {ENGINE_DJ_CONFIG_PATH}: {exc}"
        ) from exc


def clear_engine_db_path() -> None:
    try:
        if ENGINE_DJ_CONFIG_PATH.exists():
            ENGINE_DJ_CONFIG_PATH.unlink()
    except Exception as exc:
        raise ValueError(
            f"Failed to clear Engine DJ config at {ENGINE_DJ_CONFIG_PATH}: {exc}"
        ) from exc


def _readonly_uri(db_path: Path) -> str:
    try:
        return f"{db_path.resolve().as_uri()}?mode=ro"
    except Exception as exc:
        raise ValueError(f"Invalid Engine DJ database path: {db_path}: {exc}") from exc


def _normalize_track_path(raw_path: str, db_path: Path) -> str:
    normalized = raw_path.strip().replace("\\", "/")
    # Detect if path is absolute (Windows C:/ or Unix /)
    is_absolute = (
        len(normalized) >= 3 and normalized[1] == ":" and normalized[2] == "/"
    ) or (normalized.startswith("/"))
    if is_absolute:
        # Absolute path: expand tilde and resolve
        track_path = Path(normalized).expanduser()
        return str(track_path.resolve(strict=False))
    else:
        # Engine DJ stores paths relative to Database2/ using "../" prefix.
        # Resolving against grandparent^3 of m.db yields the correct absolute path.
        # Structure: Music/ > Engine Library/ > Database2/ > m.db
        resolved = (Path(db_path).parent.parent.parent / normalized).resolve()
        return str(resolved)


def _query_track_playlists(connection: sqlite3.Connection, db_path: Path) -> dict[str, list[str]]:
    # Each entry: (SQL query, junction table name used for missing-table detection)
    candidates = [
        # Engine DJ 4.x
        (
            """
            SELECT t.path, p.title
            FROM Track AS t
            JOIN PlaylistEntity AS pe ON pe.trackId = t.id
            JOIN Playlist AS p ON p.id = pe.listId
            WHERE t.path IS NOT NULL
              AND t.path != ''
              AND p.title IS NOT NULL
              AND p.title != ''
            """,
            "PlaylistEntity",
        ),
        # Engine DJ older versions
        (
            """
            SELECT t.path, p.title
            FROM Track AS t
            JOIN PlaylistTrack AS pt ON pt.trackId = t.id
            JOIN Playlist AS p ON p.id = pt.playlistId
            WHERE t.path IS NOT NULL
              AND t.path != ''
              AND p.title IS NOT NULL
              AND p.title != ''
            """,
            "PlaylistTrack",
        ),
        # Engine DJ legacy versions
        (
            """
            SELECT t.path, l.title
            FROM Track AS t
            JOIN ListTrack AS lt ON lt.trackId = t.id
            JOIN List AS l ON l.id = lt.listId
            WHERE t.path IS NOT NULL
              AND t.path != ''
              AND l.title IS NOT NULL
              AND l.title != ''
            """,
            "ListTrack",
        ),
    ]

    last_error: sqlite3.OperationalError | None = None
    for query, junction_table in candidates:
        try:
            rows = connection.execute(query).fetchall()
            mapping: dict[str, list[str]] = {}
            for track_path_raw, playlist_name in rows:
                if not isinstance(track_path_raw, str) or not isinstance(playlist_name, str):
                    continue
                track_path = _normalize_track_path(track_path_raw, db_path)
                playlists = mapping.setdefault(track_path, [])
                if playlist_name not in playlists:
                    playlists.append(playlist_name)
            return mapping
        except sqlite3.OperationalError as exc:
            if "database is locked" in str(exc).lower():
                raise EngineDJLockedError("Engine DJ database is locked") from exc
            if _is_missing_table(exc, junction_table):
                last_error = exc
                continue
            raise EngineDJSchemaError(
                f"Engine DJ schema query failed ({junction_table}): {exc}"
            ) from exc

    raise EngineDJSchemaError(
        "Engine DJ schema not recognized: no known table combination found"
    ) from last_error


def _is_missing_table(error: sqlite3.OperationalError, table_name: str) -> bool:
    message = str(error).lower()
    return f"no such table: {table_name.lower()}" in message


def read_engine_library(db_path: Path) -> dict[str, list[str]]:
    if not db_path.exists() or not db_path.is_file():
        raise ValueError(f"Engine DJ database file not found: {db_path}")

    uri = _readonly_uri(db_path)
    try:
        with sqlite3.connect(uri, uri=True) as connection:
            return _query_track_playlists(connection, db_path)
    except EngineDJLockedError:
        raise
    except EngineDJSchemaError:
        raise
    except sqlite3.OperationalError as exc:
        if "database is locked" in str(exc).lower():
            raise EngineDJLockedError(f"Engine DJ database is locked: {db_path}") from exc
        raise EngineDJSchemaError(
            f"Failed to open or read Engine DJ database schema: {exc}"
        ) from exc
    except Exception as exc:
        raise ValueError(f"Failed to read Engine DJ database at {db_path}: {exc}") from exc


def get_engine_dj_status(db_path: Path | None) -> dict[str, bool | str | None]:
    if db_path is None:
        return {"found": False, "path": None, "error": None}

    try:
        resolved = db_path.expanduser().resolve(strict=False)
        if not resolved.exists() or not resolved.is_file():
            return {
                "found": False,
                "path": str(resolved),
                "error": "Configured Engine DJ database path does not exist.",
            }
        return {"found": True, "path": str(resolved), "error": None}
    except Exception as exc:
        return {"found": False, "path": str(db_path), "error": str(exc)}


if __name__ == "__main__":
    result = find_engine_db()
    print(result)
