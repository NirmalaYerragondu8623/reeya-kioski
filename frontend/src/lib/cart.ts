import type { WishlistItem } from "./api";

/**
 * ProductMatch has no price field — the current /image-search response
 * doesn't return one. This derives a stable mock price from the product id
 * purely so the mock cart/checkout flow has a number to show and total.
 * Replace with real pricing once the backend exposes it per product.
 */
export function mockPriceFor(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  }
  return 5000 + (hash % 90000);
}

export function cartTotal(items: WishlistItem[]): number {
  return items.reduce((sum, item) => sum + mockPriceFor(item.id), 0);
}
