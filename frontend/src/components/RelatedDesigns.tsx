import { RELATED_PRODUCTS } from "../lib/relatedProducts";
import type { Preferences } from "./RefineSearch";

interface RelatedDesignsProps {
  category: string | null;
  preferences?: Preferences;
}

export function RelatedDesigns({ category, preferences }: RelatedDesignsProps) {
  const products = category ? RELATED_PRODUCTS[category] : undefined;
  if (!products || products.length === 0) return null;

  const selectedTags = preferences
    ? [preferences.ageGroup, preferences.priceBand, preferences.usage].filter(
        (tag): tag is string => tag !== null,
      )
    : [];

  return (
    <section className="mx-5 mt-6">
      <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
        Related designs in {category}
      </p>
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gold/40 px-2.5 py-1 text-[10px] font-medium text-gold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {products.map((product) => (
          <div
            key={product.name}
            className="overflow-hidden rounded-xl border border-gold/30 bg-neutral-950"
          >
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <p className="truncate px-1.5 py-1.5 text-[10px] text-neutral-300">
              {product.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
