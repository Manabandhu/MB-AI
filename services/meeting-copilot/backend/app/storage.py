"""Audio storage: a local folder (Docker volume) or an S3 bucket."""

import shutil
from pathlib import Path
from typing import Protocol

from .config import Settings, get_settings


class Storage(Protocol):
    def put_file(self, local_path: Path, key: str) -> None: ...
    def get_file(self, key: str, local_path: Path) -> None: ...
    def delete(self, key: str) -> None: ...
    def local_path(self, key: str) -> Path | None:
        """Path on disk when the backend is local, else None."""

    def presigned_url(self, key: str, expires_s: int) -> str | None:
        """Direct download URL when the backend supports it, else None."""


class LocalStorage:
    def __init__(self, root: str):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if self.root not in path.parents:
            raise ValueError("invalid storage key")
        return path

    def put_file(self, local_path: Path, key: str) -> None:
        dest = self._path(key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(local_path, dest)

    def get_file(self, key: str, local_path: Path) -> None:
        shutil.copyfile(self._path(key), local_path)

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)

    def local_path(self, key: str) -> Path | None:
        path = self._path(key)
        return path if path.exists() else None

    def presigned_url(self, key: str, expires_s: int) -> str | None:
        return None


class S3Storage:
    def __init__(self, bucket: str, region: str):
        import boto3

        if not bucket:
            raise ValueError("S3_BUCKET is required when STORAGE_BACKEND=s3")
        self.bucket = bucket
        self.client = boto3.client("s3", region_name=region)

    def put_file(self, local_path: Path, key: str) -> None:
        self.client.upload_file(str(local_path), self.bucket, key, ExtraArgs={"ServerSideEncryption": "aws:kms"})

    def get_file(self, key: str, local_path: Path) -> None:
        self.client.download_file(self.bucket, key, str(local_path))

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def local_path(self, key: str) -> Path | None:
        return None

    def presigned_url(self, key: str, expires_s: int) -> str | None:
        return self.client.generate_presigned_url(
            "get_object", Params={"Bucket": self.bucket, "Key": key}, ExpiresIn=expires_s
        )


_storage: Storage | None = None


def build_storage(settings: Settings) -> Storage:
    if settings.storage_backend == "s3":
        return S3Storage(settings.s3_bucket, settings.aws_region)
    return LocalStorage(settings.storage_dir)


def get_storage() -> Storage:
    global _storage
    if _storage is None:
        _storage = build_storage(get_settings())
    return _storage


def reset_storage() -> None:
    global _storage
    _storage = None
