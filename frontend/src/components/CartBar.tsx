import type { ProductMatch } from "../lib/api";
import { cartTotal } from "../lib/cart";

interface CartBarProps {
  items: ProductMatch[];
  onPlaceOrder: () => void;
}

export function CartBar({ items, onPlaceOrder }: CartBarProps) {
  if (items.length === 0) return null;

  const total = cartTotal(items);

  return (
    <div className="fixed inset-x-0 bottom-[68px] z-10 border-t border-gold/30 bg-black/95 px-5 py-3">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-400">
            {items.length} item{items.length > 1 ? "s" : ""} in cart
          </p>
          <p className="text-sm font-semibold text-gold">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          type="button"
          onClick={onPlaceOrder}
          className="rounded-full bg-gradient-to-r from-[#b8860b] via-[#f5d78e] to-[#b8860b] px-5 py-2 text-sm font-semibold text-black"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
