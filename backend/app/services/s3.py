from functools import lru_cache

import boto3
import requests

from app.config import get_settings


@lru_cache
def get_s3_client():
    settings = get_settings()
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
        # Buckets outside us-east-1 need the regional endpoint pinned explicitly —
        # boto3 otherwise signs against the legacy global s3.amazonaws.com
        # endpoint, which S3 answers with a 307 redirect that breaks presigned
        # URLs (the signature doesn't carry over to the redirected host).
        endpoint_url=f"https://s3.{settings.aws_region}.amazonaws.com",
    )


def build_object_key(user_id: str, filename: str) -> str:
    """Namespaces uploads by user so presigned URLs can't collide or overwrite."""
    return f"uploads/{user_id}/{filename}"


def generate_presigned_put_url(user_id: str, filename: str, content_type: str | None = None) -> tuple[str, str]:
    """Returns (presigned_put_url, object_key) for a direct client -> S3 upload."""
    settings = get_settings()
    client = get_s3_client()
    key = build_object_key(user_id, filename)

    params = {"Bucket": settings.s3_bucket_name, "Key": key}
    if content_type:
        params["ContentType"] = content_type

    url = client.generate_presigned_url(
        "put_object",
        Params=params,
        ExpiresIn=settings.presign_expiry_seconds,
    )
    return url, key


def build_public_url(object_key: str) -> str:
    """Constructs the public/readable URL for an object after upload completes."""
    settings = get_settings()
    return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{object_key}"


def download_image_bytes(url: str) -> bytes:
    """Downloads image bytes from a public S3 URL for embedding generation."""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content
