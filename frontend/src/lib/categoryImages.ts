// Real product photos pulled from the live catalog (reeyalifestyle.com), one
// representative image per category tile. Source: GET /products on the
// teammate's WordPress API, matched by category name. If the catalog changes
// and these go stale, re-run the same lookup and update the URLs below —
// there's no live fetch here since the WordPress API requires a server-side
// API key the frontend must never hold.
export const CATEGORY_IMAGES: Record<string, string> = {
  Earrings:
    "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-20-at-14.29.27-1.jpeg",
  Pendants:
    "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-26-at-18.48.23.jpeg",
  Necklace: "https://reeyalifestyle.com/wp-content/uploads/2025/10/NCK03.jpg",
  Rings: "https://reeyalifestyle.com/wp-content/uploads/2025/09/5-3.jpg",
  Bangles:
    "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-30-at-20.52.04.jpeg",
  Bracelets:
    "https://reeyalifestyle.com/wp-content/uploads/2025/11/WhatsApp-Image-2025-11-13-at-14.58.15.jpeg",
};
