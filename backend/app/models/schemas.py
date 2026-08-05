from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# --- Uploads ---

class PresignRequest(BaseModel):
    user_id: UUID
    filename: str
    content_type: str | None = None


class PresignResponse(BaseModel):
    upload_url: str
    object_key: str
    public_url: str


# --- Image search ---

class ImageSearchRequest(BaseModel):
    s3_url: str
    user_id: UUID


class ProductMatch(BaseModel):
    id: UUID
    name: str
    image_s3_url: str
    price: float | None = None
    similarity: float = Field(ge=-1, le=1)


class ImageSearchResponse(BaseModel):
    uploaded_image_id: UUID
    matches: list[ProductMatch]


# --- Products (used internally by index_catalog.py) ---

class ProductIn(BaseModel):
    id: UUID | None = None
    name: str
    category: str | None = None
    price: float | None = None
    image_s3_url: str


# --- Voice search ---

class VoiceSearchRequest(BaseModel):
    transcript: str
    user_id: UUID
    # Explicit filter selections (e.g. from the Refine Search preference
    # pills) — when set, these take precedence over whatever
    # extract_search_filters() infers from the transcript, so a user's
    # manual choice always wins over the LLM's guess. Each is a list since
    # Refine Search lets a customer pick more than one option per filter
    # (e.g. both "Daily Wear" and "Festive").
    category: str | None = None
    price_band: list[str] | None = None
    age_group: list[str] | None = None
    usage: list[str] | None = None


class ExtractedFilters(BaseModel):
    category: str | None = None
    price_band: list[str] | None = None
    age_group: list[str] | None = None
    usage: list[str] | None = None


class VoiceMatch(BaseModel):
    id: UUID
    name: str
    image_s3_url: str
    price: float | None = None
    category: str | None = None


class VoiceSearchResponse(BaseModel):
    search_history_id: UUID
    transcript: str
    extracted_filters: ExtractedFilters
    matches: list[VoiceMatch]


class SearchHistoryItem(BaseModel):
    id: UUID
    user_id: UUID
    transcript: str
    category: str | None = None
    price_band: str | None = None
    age_group: str | None = None
    usage: str | None = None
    search_type: str
    created_at: datetime


# --- Leads (see app/routers/leads.py) ---

class LeadRequest(BaseModel):
    session_id: UUID
    name: str
    phone: str
    item_count: int
    total_amount: float


class LeadResponse(BaseModel):
    id: UUID


class LeadListItem(BaseModel):
    id: UUID
    name: str
    phone: str
    item_count: int | None
    total_amount: float | None
    created_at: datetime
    updated_at: datetime


# --- Kiosk analytics (see ANALYTICS.md) ---

class KioskEventRequest(BaseModel):
    session_id: UUID
    event_name: str
    occurred_at: datetime
    payload: dict = Field(default_factory=dict)


class KioskEventResponse(BaseModel):
    status: str
