from schemas import AudioFile
from services.audio_service import compute_quality_score, sort_by_quality


def _audio_file(path: str, ext: str, bitrate: int, size_bytes: int) -> AudioFile:
    return AudioFile(
        path=path,
        filename=path.split("/")[-1],
        extension=ext,
        size_bytes=size_bytes,
        duration_seconds=120.0,
        title=None,
        artist=None,
        album=None,
        year=None,
        bitrate=bitrate,
        fingerprint=None,
    )


def test_compute_quality_score_prioritizes_bitrate_then_format_then_size():
    high_bitrate_mp3 = _audio_file("/tmp/a.mp3", ".mp3", bitrate=320000, size_bytes=2_000_000)
    lower_bitrate_flac = _audio_file("/tmp/b.flac", ".flac", bitrate=256000, size_bytes=2_500_000)
    same_bitrate_flac_big = _audio_file("/tmp/c.flac", ".flac", bitrate=320000, size_bytes=3_000_000)

    score_high_mp3 = compute_quality_score(high_bitrate_mp3)
    score_low_flac = compute_quality_score(lower_bitrate_flac)
    score_flac_big = compute_quality_score(same_bitrate_flac_big)

    assert score_high_mp3 > score_low_flac
    assert score_flac_big > score_high_mp3


def test_sort_by_quality_returns_descending_order():
    items = [
        _audio_file("/tmp/low.ogg", ".ogg", bitrate=128000, size_bytes=1_000_000),
        _audio_file("/tmp/mid.mp3", ".mp3", bitrate=192000, size_bytes=1_500_000),
        _audio_file("/tmp/high.flac", ".flac", bitrate=320000, size_bytes=2_500_000),
    ]

    sorted_items = sort_by_quality(items)

    assert [f.filename for f in sorted_items] == ["high.flac", "mid.mp3", "low.ogg"]
