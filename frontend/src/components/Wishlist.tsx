import type { WishlistItem } from "../lib/api";
import { ArrowLeftIcon, CloseIcon } from "./icons";

interface WishlistProps {
  items: WishlistItem[];
  onBack: () => void;
  onRemove: (id: string) => void;
}

export function Wishlist({ items, onBack, onRemove }: WishlistProps) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black text-white">
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
          <h1
            className="text-3xl text-gold"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            Wishlist
          </h1>
        </header>

        {items.length === 0 ? (
          <p className="px-5 pt-8 text-center text-sm text-neutral-500">
            Your wishlist is empty.
          </p>
        ) : (
          <section className="px-5 pt-6">
            <div className="grid grid-cols-3 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
                >
                  <img
                    src={item.image_s3_url}
                    alt={item.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.name} from wishlist`}
                    className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full border border-gold/60 bg-black/70 text-gold"
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-medium text-white">
                      {item.name}
                    </p>
                    {item.price != null && (
                      <p className="text-[11px] text-gold/80">
                        ₹{Math.round(item.price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
