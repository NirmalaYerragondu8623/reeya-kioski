import re
from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.schemas import LeadListItem, LeadRequest, LeadResponse
from app.services.supabase import get_supabase_client

router = APIRouter(tags=["leads"])


@router.get("/leads", response_model=list[LeadListItem])
def list_leads() -> list[LeadListItem]:
    """Returns every lead, most recently created first.

    Single-tenant: this kiosk deployment has one store and no user/auth
    system, so there's no owner to scope by — every lead belongs to whoever
    is looking at this endpoint.
    """
    supabase = get_supabase_client()
    result = (
        supabase.table("leads")
        .select("id, name, phone, item_count, total_amount, created_at, updated_at")
        .order("created_at", desc=True)
        .execute()
    )
    return [LeadListItem(**row) for row in result.data]


def normalize_phone(raw: str) -> str:
    """Strips formatting so the same number typed differently (spaces, +91,
    a leading 0) still matches the same stored row. India-specific: a 12-digit
    number starting with the "91" country code, or an 11-digit number with a
    leading trunk "0", is reduced to the bare 10-digit number."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits


@router.post("/leads", response_model=LeadResponse)
def submit_lead(payload: LeadRequest) -> LeadResponse:
    """Upserts by (normalized) phone number — a repeat submission from the
    same customer, even across separate kiosk sessions, updates one row
    instead of creating a duplicate. `session_ids` accumulates every
    session_id this phone has ever submitted under, so the customer's full
    kiosk_events history across all their visits stays linkable."""
    supabase = get_supabase_client()
    phone = normalize_phone(payload.phone)
    session_id = str(payload.session_id)

    existing = supabase.table("leads").select("id, session_ids").eq("phone", phone).execute()

    if existing.data:
        lead_id = existing.data[0]["id"]
        session_ids = existing.data[0]["session_ids"] or []
        if session_id not in session_ids:
            session_ids.append(session_id)

        supabase.table("leads").update(
            {
                "name": payload.name,
                "session_ids": session_ids,
                "item_count": payload.item_count,
                "total_amount": payload.total_amount,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", lead_id).execute()
    else:
        inserted = (
            supabase.table("leads")
            .insert(
                {
                    "phone": phone,
                    "name": payload.name,
                    "session_ids": [session_id],
                    "item_count": payload.item_count,
                    "total_amount": payload.total_amount,
                }
            )
            .execute()
        )
        lead_id = inserted.data[0]["id"]

    return LeadResponse(id=lead_id)
