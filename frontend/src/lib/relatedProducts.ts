// Real product photos pulled from the live catalog (reeyalifestyle.com), a
// handful per category, used as a "related designs" live preview on the
// Refine Search screen. Same sourcing method as categoryImages.ts — see that
// file's comment for why there's no live fetch here.
export interface RelatedProduct {
  name: string;
  image: string;
}

export const RELATED_PRODUCTS: Record<string, RelatedProduct[]> = {
  Earrings: [
    {
      name: "The Power Pair Earrings",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-20-at-14.29.27-1.jpeg",
    },
    {
      name: "High-Impact Elegance",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-20-at-14.29.27.jpeg",
    },
    {
      name: "The After-Dark Edit",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-20-at-14.29.28-2.jpeg",
    },
    {
      name: "Midnight Muse Earrings",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-20-at-14.29.28-1.jpeg",
    },
    {
      name: "Statement in Every Spark",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-20-at-14.29.28.jpeg",
    },
  ],
  Pendants: [
    {
      name: "Spotlight Sparkle Diamond Pendant (Pave)",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-26-at-18.48.23.jpeg",
    },
    {
      name: "Evening Allure Diamond Pendant (Pave)",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-26-at-18.53.46.jpeg",
    },
    {
      name: "Shimmer Mode Diamond Pendant",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-26-at-18.57.52.jpeg",
    },
    {
      name: "Party Poise Diamond Pendant",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-26-at-19.01.21.jpeg",
    },
    {
      name: "Glam Statement Diamond Pendant",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-26-at-19.06.32.jpeg",
    },
  ],
  Necklace: [
    { name: "Vivid Symphony", image: "https://reeyalifestyle.com/wp-content/uploads/2025/10/NCK03.jpg" },
    { name: "Midnight Mirage", image: "https://reeyalifestyle.com/wp-content/uploads/2025/10/NCK02.jpg" },
    {
      name: "The Luxe Loop",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2025/09/IMG_20250905_190054-scaled-1.jpg",
    },
    {
      name: "Midnight Mosaic",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/08/NS-20-Photoroom.png",
    },
    {
      name: "Celeste Bar Pendant",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/08/NS-21Fancy-scaled.jpg",
    },
  ],
  Rings: [
    { name: "Crafted to Shine", image: "https://reeyalifestyle.com/wp-content/uploads/2025/09/5-3.jpg" },
    { name: "The Iconic Sparkle", image: "https://reeyalifestyle.com/wp-content/uploads/2025/09/15.jpg" },
    {
      name: "Radiant Soul Solitaire Ring",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/06/8-3.jpg",
    },
    {
      name: "Timeless Grace Solitaire Ring",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/06/7-2.jpg",
    },
    {
      name: "The Eternal Bond Solitaire Ring",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/06/6-2.jpg",
    },
  ],
  Bangles: [
    {
      name: "Trendy Navaratna Diamond Bangles",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2026/01/WhatsApp-Image-2025-12-30-at-20.52.04.jpeg",
    },
    {
      name: "The Luxe Linea Bangle",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-01-at-19.25.43.jpeg",
    },
    {
      name: "The Luxe Affair",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/09/Untitled-design-13.jpg",
    },
    {
      name: "The Infinity Gleam",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/06/Untitled-design-13-2.jpg",
    },
    {
      name: "Everyday Empress",
      image: "https://reeyalifestyle.com/wp-content/uploads/2025/06/Untitled-design-12-3.jpg",
    },
  ],
  Bracelets: [
    {
      name: "Multi-shaped Diamond Tennis Bracelet",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2025/11/WhatsApp-Image-2025-11-13-at-14.58.15.jpeg",
    },
    {
      name: "The Elegance Flow",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-28-at-09.32.59.jpeg",
    },
    { name: "Wings of Light", image: "https://reeyalifestyle.com/wp-content/uploads/2025/10/6.png" },
    {
      name: "Grace in Motion",
      image:
        "https://reeyalifestyle.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-26-at-12.46.48-1.jpeg",
    },
    {
      name: "Eternal Glamour: The Classic Solitaire Tennis Bracelet",
      image: "https://reeyalifestyle.com/wp-content/uploads/2024/05/5.png",
    },
  ],
};
