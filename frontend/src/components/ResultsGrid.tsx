import type { ProductMatch } from "../lib/api";

interface ResultsGridProps {
  matches: ProductMatch[];
  onView?: (product: ProductMatch) => void;
  onAddToCart?: (product: ProductMatch) => void;
}

export function ResultsGrid({ matches, onView, onAddToCart }: ResultsGridProps) {
  if (matches.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-neutral-500">
        No similar products found. Try a clearer, well-lit photo.
      </p>
    );
  }

  return (
    <section className="px-5 pt-6">
      <h2
        className="text-lg text-gold"
        style={{ fontFamily: "var(--font-serif-display)" }}
      >
        Similar designs
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {matches.map((match) => (
          <button
            key={match.id}
            type="button"
            onClick={() => onView?.(match)}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-950 text-left"
          >
            <img
              src={match.image_s3_url}
              alt={match.name}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(match);
              }}
              aria-label={`Add ${match.name} to cart`}
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full border border-gold/60 bg-black/70 text-gold"
            >
              +
            </button>
            <div className="p-2.5">
              <p className="truncate text-xs font-medium text-white">
                {match.name}
              </p>
              <p className="text-[11px] text-gold/80">
                {Math.round(match.similarity * 100)}% match
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
