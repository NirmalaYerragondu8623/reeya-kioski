import { useEffect, useRef, useState } from "react";
import { CartBar } from "./components/CartBar";
import { CATEGORY_LABELS, CategoryGrid } from "./components/CategoryGrid";
import { Header } from "./components/Header";
import { ImageSearchResults } from "./components/ImageSearchResults";
import { RefineSearch } from "./components/RefineSearch";
import { Wishlist } from "./components/Wishlist";
import {
  clearVoiceSearchCache,
  findSimilarProducts,
  submitLead,
  type ProductMatch,
  type VoiceMatch,
  type WishlistItem,
} from "./lib/api";
import { initSession, startNewSession, trackEvent } from "./lib/analytics";
import { cartTotal } from "./lib/cart";

type Status = "idle" | "loading" | "done" | "error";
type View = "products" | "refine" | "image-results";

function App() {
  const [view, setView] = useState<View>("products");
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [voiceQuery, setVoiceQuery] = useState<string | null>(null);
  const [cart, setCart] = useState<WishlistItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initSession();
  }, []);

  function matchCategoryFromQuery(query: string): string | null {
    const normalized = query.toLowerCase();
    return CATEGORY_LABELS.find((label) => normalized.includes(label.toLowerCase())) ?? null;
  }

  function handleQuery(query: string, source: "voice" | "text") {
    trackEvent("search_performed", { query, source });
    setVoiceQuery(query);
    const matched = matchCategoryFromQuery(query);
    if (matched) {
      setActiveCategory(matched);
    }
    setView("refine");
  }

  // Called while retrying voice input from inside Refine Search ("Change").
  // Without re-checking for a category here, saying a different category
  // than the one the screen opened with left `activeCategory` stuck on the
  // old value, which RefineSearch always sends as an override — so the new
  // category's results never actually applied.
  function handleVoiceUpdated(query: string) {
    setVoiceQuery(query);
    const matched = matchCategoryFromQuery(query);
    if (matched) {
      setActiveCategory(matched);
    }
  }

  function handleCategorySelect(label: string) {
    if (!label) {
      setActiveCategory(null);
      return;
    }
    setActiveCategory(label);
    trackEvent("category_viewed", { category_name: label });
    setView("refine");
  }

  function handleVoiceProductView(product: VoiceMatch) {
    trackEvent("product_viewed", {
      product_id: product.id,
      product_name: product.name,
      category_name: product.category,
    });
  }

  function handleProductView(product: ProductMatch) {
    trackEvent("product_viewed", {
      product_id: product.id,
      product_name: product.name,
      category_name: activeCategory,
    });
  }

  function handleToggleWishlist(product: WishlistItem) {
    setCart((prev) => {
      const alreadyWishlisted = prev.some((item) => item.id === product.id);
      trackEvent(
        alreadyWishlisted ? "product_removed_from_wishlist" : "product_added_to_cart",
        { product_id: product.id, product_name: product.name },
      );
      return alreadyWishlisted
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product];
    });
  }

  function handleRemoveFromCart(id: string) {
    setCart((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) {
        trackEvent("product_removed_from_wishlist", {
          product_id: removed.id,
          product_name: removed.name,
        });
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function handleNewUser() {
    if (cart.length > 0) {
      trackEvent("order_abandoned", { item_count: cart.length });
    }
    startNewSession();
    clearVoiceSearchCache();

    setCart([]);
    setPreviewUrl(null);
    setStatus("idle");
    setMatches([]);
    setError(null);
    setActiveCategory(null);
    setVoiceQuery(null);
    setIsWishlistOpen(false);
    setView("products");
  }

  async function handlePlaceOrder(name: string, phone: string) {
    const itemCount = cart.length;
    const totalAmount = cartTotal(cart);
    await submitLead(name, phone, itemCount, totalAmount);
    trackEvent("order_completed", { total_amount: totalAmount, item_count: itemCount });
    setCart([]);
  }

  async function handleSelect(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStatus("loading");
    setError(null);
    setView("image-results");
    try {
      const result = await findSimilarProducts(
        file,
        activeCategory || undefined,
      );
      setMatches(result.matches);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function handleBackFromImageResults() {
    setStatus("idle");
    setPreviewUrl(null);
    setMatches([]);
    setError(null);
    setView("products");
  }

  const wishlistIds = new Set(cart.map((item) => item.id));

  let content;
  if (view === "refine") {
    content = (
      <RefineSearch
        category={activeCategory}
        voiceQuery={voiceQuery}
        onBack={() => {
          setActiveCategory(null);
          setVoiceQuery(null);
          setView("products");
        }}
        onVoiceUpdated={handleVoiceUpdated}
        onProductView={handleVoiceProductView}
        onToggleWishlist={handleToggleWishlist}
        wishlistIds={wishlistIds}
        onNewUser={handleNewUser}
      />
    );
  } else if (view === "image-results" && previewUrl) {
    content = (
      <ImageSearchResults
        previewUrl={previewUrl}
        status={status === "idle" ? "loading" : status}
        matches={matches}
        error={error}
        onBack={handleBackFromImageResults}
        onView={handleProductView}
        onToggleWishlist={handleToggleWishlist}
        onNewUser={handleNewUser}
        wishlistIds={wishlistIds}
      />
    );
  } else {
    content = (
      <div className="flex h-dvh flex-col overflow-hidden bg-black text-white">
        <div
          className={`flex h-full w-full flex-col ${
            cart.length > 0 ? "pb-24" : ""
          }`}
        >
          <Header
            onCameraClick={() => fileInputRef.current?.click()}
            onUploadClick={() => galleryInputRef.current?.click()}
            onVoiceResult={handleQuery}
            onNewUser={handleNewUser}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <CategoryGrid
              activeCategory={activeCategory}
              onSelect={handleCategorySelect}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSelect(file);
                e.target.value = "";
              }}
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSelect(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      {isWishlistOpen && (
        <Wishlist
          items={cart}
          onBack={() => setIsWishlistOpen(false)}
          onRemove={handleRemoveFromCart}
        />
      )}
      <CartBar
        items={cart}
        onPlaceOrder={handlePlaceOrder}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      />
    </>
  );
}

export default App;
