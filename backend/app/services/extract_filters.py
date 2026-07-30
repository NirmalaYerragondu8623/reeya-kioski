"""LLM-based structured filter extraction from a voice-search transcript.

Callers only ever use `extract_search_filters`. The current implementation
calls OpenAI with structured outputs (strict JSON schema mode). To swap in
Claude (Anthropic's tool-use API) or another provider later, reimplement the
body — no caller needs to change, since the signature (str in, dict out with
keys category/price_band/age_group/usage) stays the same.

The few-shot examples in _SYSTEM_PROMPT below are load-bearing, not just
documentation — an earlier version of this module only had example
transcripts in a docstring comment (never sent to the model) plus a plain
instruction not to guess, and gpt-4o-mini reliably hallucinated values for
every field regardless — e.g. "Just browsing, nothing specific" came back
with a fabricated category, price_band, age_group, and usage. Structured
outputs with `required` fields plus a bare "don't guess" instruction was not
enough to get the model to actually use null; showing it null-heavy examples
fixed this. If you touch this prompt, re-run the "just browsing" and
"what have you got in rings" cases below and confirm the unmentioned fields
still come back null before assuming it still works.

    "I am looking for earrings for my daily wear in the budget of 25 to 50 thousand"
    -> {"category": "earrings", "price_band": "25k_50k", "age_group": None, "usage": "daily_wear"}

    "What have you got in rings"
    -> {"category": "rings", "price_band": None, "age_group": None, "usage": None}

    "Just browsing, nothing specific"
    -> {"category": None, "price_band": None, "age_group": None, "usage": None}
"""

import json
from functools import lru_cache

from openai import OpenAI

from app.config import get_settings
from app.services.filter_constants import AGE_GROUPS, CATEGORIES, PRICE_BANDS, USAGE_TYPES

_FILTER_SCHEMA = {
    "type": "object",
    "properties": {
        # `null` must be listed in `enum` explicitly, not just in `type` — in
        # strict JSON Schema, `enum` and `type` are both enforced, so without
        # this the constrained decoder never actually treats null as legal
        # and always fills in some enum value (verified against the real API:
        # every field came back hallucinated until null was added here).
        "category": {"type": ["string", "null"], "enum": CATEGORIES + [None]},
        "price_band": {"type": ["string", "null"], "enum": PRICE_BANDS + [None]},
        "age_group": {"type": ["string", "null"], "enum": AGE_GROUPS + [None]},
        "usage": {"type": ["string", "null"], "enum": USAGE_TYPES + [None]},
    },
    "required": ["category", "price_band", "age_group", "usage"],
    "additionalProperties": False,
}

_SYSTEM_PROMPT = """Extract jewelry search filters from the user's transcript.

Set a field to null if it isn't mentioned or can't be confidently inferred. \
Do not guess — a field being unset is the correct, expected output most of \
the time. Never infer age_group or usage from category or price alone \
(e.g. "earrings" does not imply any particular age_group).

Examples:

Transcript: "I am looking for earrings for my daily wear in the budget of 25 to 50 thousand"
Output: {"category": "earrings", "price_band": "25k_50k", "age_group": null, "usage": "daily_wear"}

Transcript: "Show me bridal necklaces above 1 lakh"
Output: {"category": "necklace", "price_band": "above_1l", "age_group": null, "usage": "bridal"}

Transcript: "Something for my mom, she likes classic pieces, maybe bangles for daily wear"
Output: {"category": "bangles", "price_band": null, "age_group": "classic", "usage": "daily_wear"}

Transcript: "What have you got in rings"
Output: {"category": "rings", "price_band": null, "age_group": null, "usage": null}

Transcript: "Just browsing, nothing specific"
Output: {"category": null, "price_band": null, "age_group": null, "usage": null}
"""


@lru_cache
def _get_client() -> OpenAI:
    return OpenAI(api_key=get_settings().openai_api_key)


def extract_search_filters(transcript: str) -> dict:
    """Extracts {category, price_band, age_group, usage} from a transcript,
    each null if not mentioned."""
    client = _get_client()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": transcript},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": "search_filters", "schema": _FILTER_SCHEMA, "strict": True},
        },
    )
    return json.loads(response.choices[0].message.content)
