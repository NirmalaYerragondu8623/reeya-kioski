import { useEffect, useRef, useState } from "react";
import { ClockIcon, CopyIcon, PhoneIcon, RefreshIcon } from "./components/icons";
import { fetchLeads, getLeadsSocketUrl, type Lead } from "./lib/api";

type Status = "loading" | "done" | "error";

function formatCartSummary(itemCount: number | null, totalAmount: number | null): string | null {
  if (itemCount == null && totalAmount == null) return null;
  const parts: string[] = [];
  if (itemCount != null) parts.push(`${itemCount} item${itemCount === 1 ? "" : "s"}`);
  if (totalAmount != null) parts.push(`₹${Math.round(totalAmount).toLocaleString("en-IN")}`);
  return parts.join(" · ");
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Opens /ws/leads once `enabled` becomes true (see LeadsPage: only after the
 * initial GET /leads fetch has populated the list), and reconnects with
 * exponential backoff (1s, 2s, 4s... capped at 30s) if the connection drops.
 * `onNewLead` is kept in a ref so reconnects aren't triggered by every
 * parent re-render — only `enabled` flipping does that.
 */
function useLeadsSocket(enabled: boolean, onNewLead: (lead: Lead) => void) {
  const onNewLeadRef = useRef(onNewLead);
  onNewLeadRef.current = onNewLead;

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let cancelled = false;
    let attempt = 0;

    function connect() {
      socket = new WebSocket(getLeadsSocketUrl());

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === "new_lead" && message.lead) {
            onNewLeadRef.current(message.lead as Lead);
          }
        } catch {
          // Ignore malformed messages rather than crashing the socket handler.
        }
      };

      socket.onopen = () => {
        attempt = 0; // a clean connection resets the backoff
      };

      socket.onclose = () => {
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        attempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [enabled]);
}

function LeadCard({ lead, isNew }: { lead: Lead; isNew: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — the
      // click-to-call link is still there as a fallback.
    }
  }

  const cartSummary = formatCartSummary(lead.item_count, lead.total_amount);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-neutral-950 p-4 ${
        isNew ? "animate-[lead-in_0.6s_ease-out]" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <p
          className="text-lg font-semibold text-gold"
          style={{ fontFamily: "var(--font-serif-display)" }}
        >
          {lead.name}
        </p>
        {isNew && (
          <span className="rounded-full border border-gold/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gold">
            New
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-neutral-200">
          <PhoneIcon className="size-4 text-gold" />
          {lead.phone}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy phone number"
          className="text-neutral-500 transition-colors hover:text-gold"
        >
          <CopyIcon className="size-4" />
        </button>
        {copied && <span className="text-[11px] text-gold">Copied</span>}
      </div>

      {cartSummary && <p className="mt-2 text-xs text-neutral-400">{cartSummary}</p>}

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500">
        <ClockIcon className="size-3.5" />
        {formatTimestamp(lead.created_at)}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  // Ids delivered over the socket this session, purely for the "New" badge —
  // never cleared on refresh, only reset by a full page reload.
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const [socketEnabled, setSocketEnabled] = useState(false);

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchLeads();
      setLeads(data);
      setStatus("done");
      setSocketEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useLeadsSocket(socketEnabled, (lead) => {
    setLeads((prev) => (prev.some((existing) => existing.id === lead.id) ? prev : [lead, ...prev]));
    setNewLeadIds((prev) => new Set(prev).add(lead.id));
  });

  return (
    <div className="relative min-h-dvh text-neutral-900">
      {/* Light jewel-toned backdrop, echoing the amethyst crown gems in the Reeya
          logo. `fixed` (viewport-relative, not document-relative) so it stays the
          same background everywhere on the page, no matter how long the leads
          list scrolls — an `absolute` layer here would only cover the top of a
          tall page and fade out further down. */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-purple-100">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-200 via-fuchsia-100 to-rose-100" />
        <div className="absolute -top-40 -left-40 size-[30rem] rounded-full bg-purple-400/40 blur-[100px]" />
        <div className="absolute -top-40 -right-40 size-[30rem] rounded-full bg-fuchsia-400/35 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 size-[30rem] rounded-full bg-violet-400/40 blur-[100px]" />
        <div className="absolute -right-40 -bottom-40 size-[30rem] rounded-full bg-rose-300/40 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 md:block">
        {/* `md:fixed md:top-1/2 md:-translate-y-1/2` keeps this vertically
            centered in the viewport; `md:left-36` shifts it right of the
            screen edge into the middle of the left gutter (between the edge
            and the leads list) rather than flush against the edge. */}
        <aside className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-neutral-950 p-8 shadow-lg md:fixed md:top-1/2 md:left-64 md:w-96 md:-translate-y-1/2">
          <img
            src="/leads-qr.jpeg"
            alt="Scan to connect with Reeya"
            className="w-80 rounded-xl bg-white p-3"
          />
          <p className="text-center text-sm text-neutral-300">
            Scan the QR code to checkout this kiosk
          </p>
        </aside>

        <div className="min-w-0 flex-1 md:pl-[46rem]">
          {/* Capped width so the cards sit at a fixed size to the left of the
              flex-1 space instead of stretching to the far right edge of the
              (very wide) max-w-7xl container. */}
          <div className="md:max-w-md">
            <header className="flex items-center justify-between">
              <h1 className="text-3xl text-purple-950" style={{ fontFamily: "var(--font-serif-display)" }}>
                Leads
              </h1>
              <button
                type="button"
                onClick={load}
                aria-label="Refresh leads"
                disabled={status === "loading"}
                className="flex size-9 items-center justify-center rounded-full border border-purple-400 text-purple-800 disabled:opacity-40"
              >
                <RefreshIcon className="size-4" />
              </button>
            </header>

            {status === "loading" && (
              <p className="pt-8 text-center text-sm text-purple-700">Loading leads...</p>
            )}
            {status === "error" && <p className="pt-8 text-center text-sm text-red-600">{error}</p>}
            {status === "done" && leads.length === 0 && (
              <p className="pt-8 text-center text-sm text-purple-700">No leads yet.</p>
            )}
            {status === "done" && leads.length > 0 && (
              <div className="mt-6 flex flex-col gap-3">
                {leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} isNew={newLeadIds.has(lead.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
