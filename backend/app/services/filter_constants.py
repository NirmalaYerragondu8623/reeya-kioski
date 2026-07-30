"""Fixed vocabularies shared between voice-search filter extraction
(extract_filters.py) and the product query logic (routers/voice_search.py) —
kept in one place so the two never drift out of sync.

Note: PRICE_BANDS uses a different label spelling (snake_case, e.g.
'25k_50k') than products.price_range (the generated column matching the
frontend's Price Band filter, e.g. '25K-50K'). PRICE_BAND_RANGES maps
straight to numeric bounds so product queries filter on the raw `price`
column instead of needing the two label vocabularies to match — the numeric
boundaries themselves are identical to migration 008's, just spelled
differently for this feature.

CATEGORY_KEYWORDS exists because the real products.category data (from the
teammate's API, see index_catalog.py) is free-text and inconsistent — things
like "Bali Earrings", "Catelog studs", "DailyWear Studs" all mean "earrings"
but none of them equal the fixed category name exactly. Matching is
best-effort substring/keyword matching, not exact — categories with no clear
type signal (e.g. "Diamond", "Solitaire Collection", "Uncategorized") won't
match any of these 6 buckets and are excluded from category-filtered results.
"""

CATEGORIES = ["earrings", "pendants", "necklace", "rings", "bangles", "bracelets"]

# Case-insensitive regex per category, matched against products.category via
# PostgREST's `imatch` filter. "rings" needs a `\m` word-boundary so it
# doesn't also match "Earrings" (which contains the substring "ring").
CATEGORY_PATTERNS: dict[str, str] = {
    "earrings": "earring|stud",
    "pendants": "pendant|pendent|mangalsutra",
    "necklace": "necklace|choker",
    "rings": r"\mring",
    "bangles": "bangle",
    "bracelets": "bracelet",
}

PRICE_BANDS = ["below_10k", "10k_25k", "25k_50k", "50k_1l", "above_1l"]

# (min, max) in rupees; max=None means unbounded above.
PRICE_BAND_RANGES: dict[str, tuple[float, float | None]] = {
    "below_10k": (0, 10_000),
    "10k_25k": (10_000, 25_000),
    "25k_50k": (25_000, 50_000),
    "50k_1l": (50_000, 100_000),
    "above_1l": (100_000, None),
}

AGE_GROUPS = ["teens", "elegant", "classic"]

USAGE_TYPES = ["daily_wear", "office_wear", "party_wear", "festive", "bridal"]
