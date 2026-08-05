import { useEffect, useState } from "react";
import { ClockIcon, CopyIcon, PhoneIcon, RefreshIcon } from "./components/icons";
import { fetchLeads, type Lead } from "./lib/api";

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

function LeadCard({ lead }: { lead: Lead }) {
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
    <div className="rounded-2xl border border-white/10 bg-neutral-950 p-4">
      <p
        className="text-lg font-semibold text-gold"
        style={{ fontFamily: "var(--font-serif-display)" }}
      >
        {lead.name}
      </p>

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

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchLeads();
      setLeads(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-2xl px-5 pt-6 pb-16">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl text-gold" style={{ fontFamily: "var(--font-serif-display)" }}>
            Leads
          </h1>
          <button
            type="button"
            onClick={load}
            aria-label="Refresh leads"
            disabled={status === "loading"}
            className="flex size-9 items-center justify-center rounded-full border border-gold/40 text-gold/80 disabled:opacity-40"
          >
            <RefreshIcon className="size-4" />
          </button>
        </header>

        {status === "loading" && (
          <p className="pt-8 text-center text-sm text-neutral-400">Loading leads...</p>
        )}
        {status === "error" && <p className="pt-8 text-center text-sm text-red-400">{error}</p>}
        {status === "done" && leads.length === 0 && (
          <p className="pt-8 text-center text-sm text-neutral-500">No leads yet.</p>
        )}
        {status === "done" && leads.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
