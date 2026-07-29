import type { ProductMatch } from "../lib/api";

interface ResultsGridProps {
  matches: ProductMatch[];
}

export function ResultsGrid({ matches }: ResultsGridProps) {
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
          <div
            key={match.id}
            className="overflow-hidden rounded-xl border border-gold/40 bg-neutral-950"
          >
            <img
              src={match.image_s3_url}
              alt={match.name}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
            <div className="p-2.5">
              <p className="truncate text-xs font-medium text-white">
                {match.name}
              </p>
              <p className="text-[11px] text-gold/80">
                {Math.round(match.similarity * 100)}% match
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
