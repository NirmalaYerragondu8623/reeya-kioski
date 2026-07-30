const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const SESSION_STORAGE_KEY = "reeya_kiosk_session_id";

let sessionId: string | null = null;

function persistSessionId(id: string) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, id);
}

function send(eventName: string, payload: Record<string, unknown>) {
  if (!sessionId) return;

  const body = JSON.stringify({
    session_id: sessionId,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    payload,
  });
  const url = `${API_BASE}/events`;

  // sendBeacon survives page unload (needed for session_ended on tab close);
  // fall back to a keepalive fetch everywhere else.
  if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) {
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the kiosk UI — the backend endpoint may
    // not exist yet, or the network call may fail; either way, swallow it.
  });
}

/** Records an event under the current session. No-ops until a session has started. */
export function trackEvent(eventName: string, payload: Record<string, unknown> = {}) {
  send(eventName, payload);
}

/** The current kiosk session id, so other backend calls (e.g. leads) can be linked to it. */
export function getSessionId(): string | null {
  return sessionId;
}

/** Resumes the stored session (if any) or starts a fresh one — call once on app load. */
export function initSession(): string {
  if (sessionId) return sessionId;

  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    sessionId = stored;
    return sessionId;
  }

  sessionId = crypto.randomUUID();
  persistSessionId(sessionId);
  send("session_started", {});
  return sessionId;
}

/** Ends the current session and starts a brand new one — call from "New User". */
export function startNewSession(): string {
  if (sessionId) {
    send("session_ended", {});
  }
  sessionId = crypto.randomUUID();
  persistSessionId(sessionId);
  send("session_started", {});
  return sessionId;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    send("session_ended", {});
  });
}
