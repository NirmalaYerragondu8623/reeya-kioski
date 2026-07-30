import type { ProductMatch } from "../lib/api";
import { cartTotal } from "../lib/cart";
import { HeartIcon } from "./icons";

interface CartBarProps {
  items: ProductMatch[];
  onPlaceOrder: () => void;
  onOpenWishlist: () => void;
}

export function CartBar({ items, onPlaceOrder, onOpenWishlist }: CartBarProps) {
  if (items.length === 0) return null;

  const total = cartTotal(items);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-black/95 px-5 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-400">
            {items.length} item{items.length > 1 ? "s" : ""} in cart
          </p>
          <p className="text-sm font-semibold text-gold">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label="Open wishlist"
            className="flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-sm font-semibold text-gold"
          >
            <HeartIcon className="size-4" />
            Open Wishlist
          </button>
          <button
            type="button"
            onClick={onPlaceOrder}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Let's connect
          </button>
        </div>
      </div>
    </div>
  );
}
