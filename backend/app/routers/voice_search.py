import logging
from uuid import UUID

from fastapi import APIRouter

from app.models.schemas import ExtractedFilters, SearchHistoryItem, VoiceMatch, VoiceSearchRequest, VoiceSearchResponse
from app.services.extract_filters import extract_search_filters
from app.services.filter_constants import CATEGORY_PATTERNS, PRICE_BAND_RANGES
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice-search"])

MATCH_LIMIT = 20


@router.post("/voice-search", response_model=VoiceSearchResponse)
def voice_search(payload: VoiceSearchRequest) -> VoiceSearchResponse:
    transcript = payload.transcript
    user_id = payload.user_id
    filters = extract_search_filters(transcript)

    supabase = get_supabase_client()
    query = supabase.table("products").select("id, name, image_s3_url, price, category")

    category = filters.get("category")
    if category and category in CATEGORY_PATTERNS:
        query = query.filter("category", "imatch", CATEGORY_PATTERNS[category])

    price_band = filters.get("price_band")
    if price_band and price_band in PRICE_BAND_RANGES:
        min_price, max_price = PRICE_BAND_RANGES[price_band]
        query = query.gte("price", min_price)
        if max_price is not None:
            query = query.lt("price", max_price)

    age_group = filters.get("age_group")
    if age_group:
        query = query.eq("age_group", age_group)

    usage = filters.get("usage")
    if usage:
        query = query.eq("usage", usage)

    result = query.limit(MATCH_LIMIT).execute()

    history = (
        supabase.table("search_history")
        .insert(
            {
                "user_id": str(user_id),
                "transcript": transcript,
                "category": category,
                "price_band": price_band,
                "age_group": age_group,
                "usage": usage,
                "search_type": "voice",
            }
        )
        .execute()
    )

    return VoiceSearchResponse(
        search_history_id=history.data[0]["id"],
        transcript=transcript,
        extracted_filters=ExtractedFilters(**filters),
        matches=[VoiceMatch(**p) for p in result.data],
    )


@router.get("/search-history", response_model=list[SearchHistoryItem])
def get_search_history(user_id: UUID) -> list[SearchHistoryItem]:
    supabase = get_supabase_client()
    result = (
        supabase.table("search_history")
        .select("*")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .execute()
    )
    return [SearchHistoryItem(**row) for row in result.data]
