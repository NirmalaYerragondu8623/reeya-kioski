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


def _merge_filter(extracted: str | None, explicit: list[str] | None) -> list[str] | None:
    """Explicit multi-select choices (Refine Search's preference pills) fully
    replace whatever the LLM extracted from the transcript — picking any
    explicit values means the user overrode that filter, one value or many."""
    if explicit:
        return [value.strip().lower() for value in explicit if value.strip()] or None
    return [extracted] if extracted else None


@router.post("/voice-search", response_model=VoiceSearchResponse)
def voice_search(payload: VoiceSearchRequest) -> VoiceSearchResponse:
    transcript = payload.transcript
    user_id = payload.user_id

    try:
        extracted = extract_search_filters(transcript)
    except Exception:
        # LLM extraction failing (API error, quota, etc.) shouldn't surface
        # as a scary error on the kiosk — treat it the same as "didn't
        # recognize anything said", which falls through to "no results"
        # below rather than an unfiltered product list.
        logger.exception(
            "Filter extraction failed for transcript=%r; treating as unrecognized", transcript
        )
        extracted = {"category": None, "price_band": None, "age_group": None, "usage": None}

    category = payload.category.strip().lower() if payload.category else extracted.get("category")
    price_bands = _merge_filter(extracted.get("price_band"), payload.price_band)
    age_groups = _merge_filter(extracted.get("age_group"), payload.age_group)
    usages = _merge_filter(extracted.get("usage"), payload.usage)

    supabase = get_supabase_client()
    understood = bool(category) or bool(price_bands) or bool(age_groups) or bool(usages)
    matches: list[dict] = []

    # A category tap with no voice/text query at all (plain category browse)
    # has an empty transcript and no filters yet — that's not "didn't
    # understand", it's just browsing, so it still runs the (unfiltered)
    # query below. A real transcript that recognized nothing, though, should
    # report no results instead of silently showing an unrelated product
    # list that looks like a match but isn't.
    if not transcript.strip() or understood:
        query = supabase.table("products").select("id, name, image_s3_url, price, category")

        if category and category in CATEGORY_PATTERNS:
            query = query.filter("category", "imatch", CATEGORY_PATTERNS[category])

        valid_bands = [band for band in price_bands or [] if band in PRICE_BAND_RANGES]
        if valid_bands:
            # price = 0 means "no real price set" (see products.price_range's
            # 'Unknown' bucket), not a genuinely free/near-free item — exclude
            # it explicitly, since price >= 0 would otherwise let it leak into
            # the cheapest band.
            query = query.gt("price", 0)
            # Multiple bands are OR'd together (e.g. "Below 10K" or "Above 1L"),
            # each band itself an AND of its own min/max bounds.
            or_clauses = []
            for band in valid_bands:
                min_price, max_price = PRICE_BAND_RANGES[band]
                if max_price is not None:
                    or_clauses.append(f"and(price.gte.{min_price},price.lt.{max_price})")
                else:
                    or_clauses.append(f"price.gte.{min_price}")
            query = query.or_(",".join(or_clauses))

        if age_groups:
            query = query.in_("age_group", age_groups)

        if usages:
            query = query.in_("usage", usages)

        matches = query.limit(MATCH_LIMIT).execute().data

    history = (
        supabase.table("search_history")
        .insert(
            {
                "user_id": str(user_id),
                "transcript": transcript,
                "category": category,
                # search_history's columns hold a single value each (see
                # schema.sql CHECK constraints) — when multiple were picked,
                # only the first is logged here. Product filtering above is
                # unaffected; this only makes the analytics log lossy for
                # multi-select searches.
                "price_band": price_bands[0] if price_bands else None,
                "age_group": age_groups[0] if age_groups else None,
                "usage": usages[0] if usages else None,
                "search_type": "voice",
            }
        )
        .execute()
    )

    return VoiceSearchResponse(
        search_history_id=history.data[0]["id"],
        transcript=transcript,
        extracted_filters=ExtractedFilters(
            category=category,
            price_band=price_bands,
            age_group=age_groups,
            usage=usages,
        ),
        matches=[VoiceMatch(**p) for p in matches],
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
