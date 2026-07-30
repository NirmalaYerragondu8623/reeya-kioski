"""Image embedding backend.

Callers only ever use `get_image_embedding` and `EMBEDDING_MODEL_NAME`. The
current implementation calls Google's Gemini Embedding 2 API (hosted,
multimodal) — swapped from a locally-run CLIP model specifically to remove
the torch/transformers memory footprint that was crashing the deployed
backend (Render OOM at 512MB). To swap providers again later, reimplement
the body of `get_image_embedding` and update `EMBEDDING_MODEL_NAME` — no
caller needs to change, since the signature (bytes in, list[float] out)
stays the same.

Note: switching providers means the old locally-computed CLIP vectors are
not comparable to these new Gemini vectors (different model, different
vector space, only compatible because both happen to output 512 dims).
Every product needs to be re-embedded via `scripts/index_catalog.py`, which
already detects this automatically via the `embedding_model` staleness
check — no extra plumbing needed, just re-run it.
"""

import io
from functools import lru_cache

from google import genai
from google.genai import types
from PIL import Image

from app.config import get_settings

EMBEDDING_MODEL_NAME = get_settings().embedding_model_name
EMBEDDING_DIM = 512

# Gemini Embedding 2's recommended output sizes are 768/1536/3072 (Matryoshka
# truncation), but it supports any size from 128-3072 — 512 is used here to
# match the existing pgvector column/index without a schema migration.

_MIME_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
    "GIF": "image/gif",
    "BMP": "image/bmp",
}


@lru_cache
def _get_client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def _detect_mime_type(image_bytes: bytes) -> str:
    with Image.open(io.BytesIO(image_bytes)) as image:
        return _MIME_TYPES.get(image.format or "", "image/jpeg")


def get_image_embedding(image_bytes: bytes) -> list[float]:
    """Generates a 512-dim image embedding via the Gemini Embedding 2 API."""
    client = _get_client()
    mime_type = _detect_mime_type(image_bytes)

    result = client.models.embed_content(
        model=EMBEDDING_MODEL_NAME,
        contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
        config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
    )
    return result.embeddings[0].values
