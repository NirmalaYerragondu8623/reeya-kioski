import logging
import re

import requests
from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import ImageSearchRequest, ImageSearchResponse, ProductMatch
from app.services.embeddings import get_image_embedding
from app.services.filter_constants import CATEGORY_PATTERNS
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

    # match_products does a regex match, not exact equality (see migration
    # 010) — translate a known category label (e.g. "Earrings") to its
    # curated pattern (e.g. "earring|stud"). An unrecognized category string
    # falls back to a literal, regex-escaped substring match on itself, so
    # arbitrary category text still works, just without the curated synonyms.
    category_pattern = None
    if category:
        category_pattern = CATEGORY_PATTERNS.get(category.strip().lower(), re.escape(category))

    supabase = get_supabase_client()
    result = supabase.rpc(
        "match_products",
        {
            "query_embedding": embedding,
            "match_count": MATCH_COUNT,
            "filter_category": category_pattern,
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
                "embedding": embedding,
            }
        )
        .execute()
    )

    if not inserted.data:
        logger.error("Failed to insert uploaded_images row for user_id=%s", payload.user_id)
        raise HTTPException(status_code=500, detail="Failed to record uploaded image")

    uploaded_image_id = inserted.data[0]["id"]

    return ImageSearchResponse(uploaded_image_id=uploaded_image_id, matches=matches)
