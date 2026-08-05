"""In-memory WebSocket connection registry for real-time lead notifications.

This app has no auth/owner/multi-tenant concept anywhere (single kiosk
store, no users table — see GET /leads's own comment), so there's one
broadcast channel for every connected staff client, not a per-owner
registry keyed by owner_id.

Single-server-only: connections live in this process's memory. If this
backend ever runs across multiple instances (e.g. Render's `standard` plan
with >1 instance, or any horizontal scaling), a lead inserted via the
instance handling POST /leads would only reach staff WebSocket connections
on that same instance — connections on other instances would never see it.
Fixing that needs a shared pub/sub layer (Redis pub/sub, or Postgres
LISTEN/NOTIFY) that every instance subscribes to and relays from, instead
of broadcasting directly from in-process memory like this does.
"""

import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class LeadConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def broadcast_new_lead(self, lead: dict) -> None:
        """Sends `{"type": "new_lead", "lead": {...}}` to every connected
        client, dropping any connection that fails to send (already closed
        but not yet cleaned up)."""
        if not self._connections:
            return

        message = json.dumps({"type": "new_lead", "lead": lead})
        dead: list[WebSocket] = []
        for websocket in self._connections:
            try:
                await websocket.send_text(message)
            except Exception:
                dead.append(websocket)

        for websocket in dead:
            self._connections.discard(websocket)


manager = LeadConnectionManager()
