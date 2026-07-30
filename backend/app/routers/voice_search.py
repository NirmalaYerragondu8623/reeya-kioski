import logging
import random
from uuid import UUID

from fastapi import APIRouter

from app.models.schemas import ExtractedFilters, SearchHistoryItem, VoiceMatch, VoiceSearchRequest, VoiceSearchResponse
from app.services.extract_filters import extract_search_filters
from app.services.filter_constants import CATEGORY_PATTERNS, PRICE_BAND_RANGES
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["voice-search"])

MATCH_LIMIT = 20

# products.age_group / products.usage aren't populated by the catalog
# ingestion pipeline (see schema.sql notes) — hard-filtering on them always
# returns zero rows. Until that data exists, a wider pool is pulled (still
# respecting category/price_band, which ARE real) and randomly sampled down
# to MATCH_LIMIT, so picking an age-group/usage filter shows a plausible set
# of products in the right category instead of an empty result.
RANDOM_SAMPLE_POOL_SIZE = 200


@router.post("/voice-search", response_model=VoiceSearchResponse)
def voice_search(payload: VoiceSearchRequest) -> VoiceSearchResponse:
    transcript = payload.transcript
    user_id = payload.user_id
    filters = extract_search_filters(transcript)

    # Explicit selections (e.g. Refine Search's preference pills) override
    # whatever the LLM extracted from the transcript. Values are normalized
    # to lowercase since the frontend's category labels are Title Case
    # ("Earrings") but our vocabularies/CHECK constraints are lowercase.
    if payload.category:
        filters["category"] = payload.category.strip().lower()
    if payload.price_band:
        filters["price_band"] = payload.price_band.strip().lower()
    if payload.age_group:
        filters["age_group"] = payload.age_group.strip().lower()
    if payload.usage:
        filters["usage"] = payload.usage.strip().lower()

    supabase = get_supabase_client()
    query = supabase.table("products").select("id, name, image_s3_url, price, category")

    category = filters.get("category")
    if category and category in CATEGORY_PATTERNS:
        query = query.filter("category", "imatch", CATEGORY_PATTERNS[category])

    price_band = filters.get("price_band")
    if price_band and price_band in PRICE_BAND_RANGES:
        min_price, max_price = PRICE_BAND_RANGES[price_band]
        # price = 0 means "no real price set" (see products.price_range's
        # 'Unknown' bucket), not a genuinely free/near-free item — exclude
        # it explicitly, since price >= 0 would otherwise let it leak into
        # the cheapest band.
        query = query.gt("price", 0).gte("price", min_price)
        if max_price is not None:
            query = query.lt("price", max_price)

    age_group = filters.get("age_group")
    usage = filters.get("usage")

    if age_group or usage:
        result = query.limit(RANDOM_SAMPLE_POOL_SIZE).execute()
        sampled = random.sample(result.data, k=min(MATCH_LIMIT, len(result.data)))
    else:
        sampled = query.limit(MATCH_LIMIT).execute().data

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
        matches=[VoiceMatch(**p) for p in sampled],
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
