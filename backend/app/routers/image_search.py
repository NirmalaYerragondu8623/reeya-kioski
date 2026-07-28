import logging

import requests
from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import ImageSearchRequest, ImageSearchResponse, ProductMatch
from app.services.embeddings import get_image_embedding
from app.services.s3 import download_image_bytes
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["image-search"])

MATCH_COUNT = 20


@router.post("/image-search", response_model=ImageSearchResponse)
def image_search(
    payload: ImageSearchRequest,
    category: str | None = Query(default=None, description="Optional category pre-filter"),
) -> ImageSearchResponse:
    try:
        image_bytes = download_image_bytes(payload.s3_url)
    except requests.RequestException as exc:
        raise HTTPException(status_code=400, detail=f"Could not download image from s3_url: {exc}") from exc

    embedding = get_image_embedding(image_bytes)

    supabase = get_supabase_client()
    result = supabase.rpc(
        "match_products",
        {
            "query_embedding": embedding,
            "match_count": MATCH_COUNT,
            "filter_category": category,
        },
    ).execute()

    matches = [ProductMatch(**row) for row in result.data]
    matched_product_ids = [str(match.id) for match in matches]

    inserted = (
        supabase.table("uploaded_images")
        .insert(
            {
                "user_id": str(payload.user_id),
                "s3_url": payload.s3_url,
                "matched_product_ids": matched_product_ids,
            }
        )
        .execute()
    )

    if not inserted.data:
        logger.error("Failed to insert uploaded_images row for user_id=%s", payload.user_id)
        raise HTTPException(status_code=500, detail="Failed to record uploaded image")

    uploaded_image_id = inserted.data[0]["id"]

    return ImageSearchResponse(uploaded_image_id=uploaded_image_id, matches=matches)
