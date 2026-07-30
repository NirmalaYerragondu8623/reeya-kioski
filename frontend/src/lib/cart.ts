import type { WishlistItem } from "./api";

export function cartTotal(items: WishlistItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0), 0);
}
