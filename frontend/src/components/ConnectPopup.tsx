import { useState, type FormEvent } from "react";
import { CloseIcon } from "./icons";

interface ConnectPopupProps {
  onCancel: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
}

type Status = "form" | "submitting" | "success" | "error";

export function ConnectPopup({ onCancel, onSubmit }: ConnectPopupProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("form");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) return;

    setStatus("submitting");
    try {
      await onSubmit(trimmedName, trimmedPhone);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={status === "form" ? onCancel : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-3xl border border-gold/60 bg-black px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
      >
        {status === "form" && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="absolute top-4 right-4 text-gold/80"
          >
            <CloseIcon className="size-4" />
          </button>
        )}

        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2
              className="text-2xl text-gold"
              style={{ fontFamily: "var(--font-serif-display)" }}
            >
              Thanks!
            </h2>
            <p className="text-sm text-neutral-300">
              We'll get back to you soon.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-2 w-full rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black"
            >
              Okay
            </button>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <h2
              className="text-2xl text-gold"
              style={{ fontFamily: "var(--font-serif-display)" }}
            >
              Something went wrong
            </h2>
            <p className="text-sm text-neutral-300">
              Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-2 w-full rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black"
            >
              Okay
            </button>
          </div>
        ) : (
          <>
            <h2
              className="text-center text-2xl text-gold"
              style={{ fontFamily: "var(--font-serif-display)" }}
            >
              Let's Connect
            </h2>
            <p className="mt-2 text-center text-xs text-neutral-400">
              Share your details and our team will get back to you soon.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full rounded-xl border border-gold/30 bg-neutral-950 px-3 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
              />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-gold/30 bg-neutral-950 px-3 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
              />

              <div className="mt-2 flex w-full gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 rounded-full border border-gold px-4 py-2.5 text-sm font-semibold text-gold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting" || !name.trim() || !phone.trim()}
                  className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black disabled:opacity-40"
                >
                  {status === "submitting" ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
