"""Image embedding backend.

Callers only ever use `get_image_embedding` and `EMBEDDING_MODEL_NAME`. The
current implementation runs CLIP locally via `transformers`. To swap in a
hosted API (e.g. Replicate) later, reimplement the body of
`get_image_embedding` and update `EMBEDDING_MODEL_NAME` — no caller needs to
change, since the signature (bytes in, list[float] out) stays the same.
"""

import io
from functools import lru_cache

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from app.config import get_settings

EMBEDDING_MODEL_NAME = get_settings().embedding_model_name
EMBEDDING_DIM = 512


@lru_cache
def _get_model_and_processor() -> tuple[CLIPModel, CLIPProcessor]:
    model = CLIPModel.from_pretrained(EMBEDDING_MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(EMBEDDING_MODEL_NAME)
    model.eval()
    return model, processor


def get_image_embedding(image_bytes: bytes) -> list[float]:
    """Generates a 512-dim, L2-normalized image embedding for similarity search."""
    model, processor = _get_model_and_processor()

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        # transformers >=5.0 returns a BaseModelOutputWithPooling here (not a
        # raw tensor) — the projected image embedding lives in .pooler_output.
        features = model.get_image_features(**inputs).pooler_output

    features = features / features.norm(p=2, dim=-1, keepdim=True)
    return features[0].tolist()
