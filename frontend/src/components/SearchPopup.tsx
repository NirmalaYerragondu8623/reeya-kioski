import { useEffect, useRef, useState, type FormEvent } from "react";
import { CloseIcon, SearchIcon } from "./icons";

interface SearchPopupProps {
  onCancel: () => void;
  onSubmit: (query: string) => void;
}

export function SearchPopup({ onCancel, onSubmit }: SearchPopupProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus opens the on-screen keyboard on touch devices since it fires
  // synchronously off the tap that opened this popup.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-3xl border border-gold/60 bg-black px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-4 right-4 text-gold/80"
        >
          <CloseIcon className="size-4" />
        </button>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4 text-center"
        >
          <span className="flex size-[74px] items-center justify-center rounded-full border-2 border-gold bg-black">
            <SearchIcon className="size-7 text-gold" />
          </span>

          <h2
            className="text-2xl text-gold"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            Search
          </h2>

          <p className="-mt-2 text-xs text-neutral-400">
            Type what you're looking for.
          </p>

          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Rings, earrings, necklaces..."
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
              disabled={!value.trim()}
              className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black disabled:opacity-40"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
