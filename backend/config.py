from pathlib import Path

FPCALC_PATHS = [
    Path(__file__).parent / "bin" / "fpcalc",
    Path(__file__).parent / "bin" / "fpcalc.exe",
    Path("fpcalc"),
]

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aiff", ".aif", ".ogg"}

# Mayor indice = mayor calidad base por formato
EXT_QUALITY_RANK = {
    ".ogg": 1,
    ".mp3": 2,
    ".aiff": 3,
    ".aif": 3,
    ".wav": 4,
    ".flac": 5,
}

ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

ENGINE_DJ_DEFAULT_PATHS: list[Path] = [
    Path.home() / "Music" / "Engine Library" / "Database2" / "m.db",
]

ENGINE_DJ_CONFIG_PATH: Path = Path(__file__).parent / "engine_dj_config.json"
