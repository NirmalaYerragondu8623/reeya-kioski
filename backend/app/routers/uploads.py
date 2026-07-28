from fastapi import APIRouter

from app.models.schemas import PresignRequest, PresignResponse
from app.services.s3 import build_public_url, generate_presigned_put_url

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign", response_model=PresignResponse)
def presign_upload(payload: PresignRequest) -> PresignResponse:
    """Returns a short-lived presigned S3 PUT URL for a direct client upload.

    Flow: client calls this endpoint -> PUTs the file bytes straight to
    `upload_url` -> then calls POST /image-search with `public_url`.
    """
    upload_url, object_key = generate_presigned_put_url(
        user_id=str(payload.user_id),
        filename=payload.filename,
        content_type=payload.content_type,
    )
    return PresignResponse(
        upload_url=upload_url,
        object_key=object_key,
        public_url=build_public_url(object_key),
    )
