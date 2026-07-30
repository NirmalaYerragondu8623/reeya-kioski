// Real product photos pulled from the live catalog (reeyalifestyle.com), one
// representative image per category tile. Source: GET /products on the
// teammate's WordPress API, matched by category name. If the catalog changes
// and these go stale, re-run the same lookup and update the URLs below —
// there's no live fetch here since the WordPress API requires a server-side
// API key the frontend must never hold.
export const CATEGORY_IMAGES: Record<string, string> = {
  Earrings: "/earrings_thumbnail.webp",
  Pendants: "/pendant_thumbnail.png",
  Necklace: "/necklace_thumbnail.png",
  Rings: "/rings_thumbnail.jpg",
  Bangles: "/bangle_thumbnail.png",
  Bracelets:
    "https://reeyalifestyle.com/wp-content/uploads/2025/11/WhatsApp-Image-2025-11-13-at-14.58.15.jpeg",
};
