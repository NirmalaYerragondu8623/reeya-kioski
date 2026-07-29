import logging

from fastapi import APIRouter

from app.models.schemas import KioskEventRequest, KioskEventResponse
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["events"])


@router.post("/events", response_model=KioskEventResponse, status_code=202)
def record_event(event: KioskEventRequest) -> KioskEventResponse:
    """Records a kiosk analytics event. Per ANALYTICS.md, this must never
    fail loudly to the kiosk — a broken analytics insert should never break
    the customer-facing UI, so failures are logged and swallowed rather than
    raised."""
    try:
        supabase = get_supabase_client()
        supabase.table("kiosk_events").insert(
            {
                "session_id": str(event.session_id),
                "event_name": event.event_name,
                "occurred_at": event.occurred_at.isoformat(),
                "payload": event.payload,
            }
        ).execute()
    except Exception:
        logger.exception("Failed to record kiosk event: %s", event.event_name)

    return KioskEventResponse(status="accepted")
