from typing import Optional

from pydantic import BaseModel


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
    files: list[AudioFile]


class ScanResult(BaseModel):
    status: str
    total_files: int
    files: list[AudioFile]
    duplicate_groups: list[DuplicateGroup]


class DeleteResult(BaseModel):
    deleted: list[str]
    failed: list[dict]
