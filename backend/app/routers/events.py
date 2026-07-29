import logging

from fastapi import APIRouter

from app.models.schemas import EventIn
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["events"])


@router.post("/events", status_code=202)
def record_event(event: EventIn) -> dict[str, str]:
    """Fire-and-forget analytics sink: one row per kiosk interaction, keyed
    by session_id. See migrations/008_create_kiosk_events_table.sql and
    ANALYTICS.md for the full schema and query cookbook.
    """
    supabase = get_supabase_client()
    try:
        supabase.table("kiosk_events").insert(
            {
                "session_id": str(event.session_id),
                "event_name": event.event_name,
                "occurred_at": event.occurred_at.isoformat(),
                "payload": event.payload,
            }
        ).execute()
    except Exception:
        # Analytics must never break the kiosk UI for a customer — log and
        # swallow rather than surfacing a 500 from a background tracking call.
        logger.exception(
            "Failed to record event_name=%s session_id=%s", event.event_name, event.session_id
        )
    return {"status": "accepted"}
