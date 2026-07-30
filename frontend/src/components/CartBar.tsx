import { useState } from "react";
import type { WishlistItem } from "../lib/api";
import { cartTotal } from "../lib/cart";
import { ConnectPopup } from "./ConnectPopup";
import { HeartIcon } from "./icons";

interface CartBarProps {
  items: WishlistItem[];
  onPlaceOrder: (name: string, phone: string) => Promise<void>;
  onOpenWishlist: () => void;
}

export function CartBar({ items, onPlaceOrder, onOpenWishlist }: CartBarProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  // Keep rendering while the popup is open even once the cart empties out
  // (submitting clears it) — otherwise the "Thanks!" confirmation would get
  // unmounted out from under the user the instant it appears.
  if (items.length === 0 && !isConnectOpen) return null;

  const total = cartTotal(items);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-black/95 px-5 py-3">
      {items.length > 0 && (
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
              onClick={() => setIsConnectOpen(true)}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
            >
              Let's connect
            </button>
          </div>
        </div>
      )}

      {isConnectOpen && (
        <ConnectPopup
          onCancel={() => setIsConnectOpen(false)}
          onSubmit={onPlaceOrder}
        />
      )}
    </div>
  );
}
