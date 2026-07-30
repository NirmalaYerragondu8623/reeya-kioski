import type { ProductMatch, WishlistItem } from "../lib/api";
import { ArrowLeftIcon, RefreshIcon } from "./icons";
import { ResultsGrid } from "./ResultsGrid";

interface ImageSearchResultsProps {
  previewUrl: string;
  status: "loading" | "done" | "error";
  matches: ProductMatch[];
  wishlistIds?: Set<string>;
  error?: string | null;
  onBack: () => void;
  onView?: (product: ProductMatch) => void;
  onToggleWishlist?: (product: WishlistItem) => void;
  onNewUser?: () => void;
}

export function ImageSearchResults({
  previewUrl,
  status,
  matches,
  wishlistIds,
  error,
  onBack,
  onView,
  onToggleWishlist,
  onNewUser,
}: ImageSearchResultsProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl pb-28">
        <header className="relative px-5 pt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute top-6 left-5 text-white"
          >
            <ArrowLeftIcon className="size-6" />
          </button>
          <button
            type="button"
            onClick={onNewUser}
            className="absolute top-6 right-5 flex shrink-0 items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5 text-sm font-medium text-gold/80"
          >
            <RefreshIcon className="size-5" />
            New User
          </button>
          <h1
            className="text-3xl text-gold"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            Search Results
          </h1>
        </header>

        <section className="mx-5 mt-6">
          <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
            Uploaded image
          </p>
          <div className="mt-3 aspect-square w-full max-w-60 overflow-hidden rounded-xl border border-white/10 bg-neutral-950">
            <img
              src={previewUrl}
              alt="Your upload"
              className="size-full object-cover"
            />
          </div>
        </section>

        {status === "loading" && (
          <p className="px-5 pt-8 text-center text-sm text-neutral-400">
            Searching the catalog...
          </p>
        )}
        {status === "error" && (
          <p className="px-5 pt-8 text-center text-sm text-red-400">{error}</p>
        )}
        {status === "done" && (
          <ResultsGrid
            matches={matches}
            wishlistIds={wishlistIds}
            onView={onView}
            onToggleWishlist={onToggleWishlist}
          />
        )}
      </div>
    </div>
  );
}
