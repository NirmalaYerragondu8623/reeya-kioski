import { useEffect, useRef, useState } from "react";
import { CartBar } from "./components/CartBar";
import { CATEGORY_LABELS, CategoryGrid } from "./components/CategoryGrid";
import { Header } from "./components/Header";
import { RefineSearch } from "./components/RefineSearch";
import { ResultsGrid } from "./components/ResultsGrid";
import { UploadedImages, type UploadedImage } from "./components/UploadedImages";
import { findSimilarProducts, type ProductMatch, type VoiceMatch } from "./lib/api";
import { initSession, trackEvent } from "./lib/analytics";
import { cartTotal } from "./lib/cart";

type Status = "idle" | "loading" | "done" | "error";
type View = "products" | "refine";

function App() {
  const [view, setView] = useState<View>("products");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [voiceQuery, setVoiceQuery] = useState<string | null>(null);
  const [cart, setCart] = useState<ProductMatch[]>([]);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initSession();
  }, []);

  function handleQuery(query: string) {
    setVoiceQuery(query);
    const normalized = query.toLowerCase();
    const matched = CATEGORY_LABELS.find((label) =>
      normalized.includes(label.toLowerCase()),
    );
    if (matched) {
      setActiveCategory(matched);
    }
    setView("refine");
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

  function handleAddToCart(product: ProductMatch) {
    setCart((prev) => [...prev, product]);
    trackEvent("product_added_to_cart", {
      product_id: product.id,
      product_name: product.name,
    });
  }

  function handlePlaceOrder() {
    trackEvent("order_completed", {
      total_amount: cartTotal(cart),
      item_count: cart.length,
    });
    setCart([]);
    setOrderMessage("Order placed — thank you!");
    window.setTimeout(() => setOrderMessage(null), 3000);
  }

  async function handleSelect(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadedImages((prev) => [{ id: crypto.randomUUID(), url }, ...prev]);
    setStatus("loading");
    setError(null);
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

  if (view === "refine") {
    return (
      <RefineSearch
        category={activeCategory}
        voiceQuery={voiceQuery}
        onBack={() => {
          setActiveCategory(null);
          setVoiceQuery(null);
          setView("products");
        }}
        onChangeCategory={() => {
          setActiveCategory(null);
          setView("products");
        }}
        onVoiceUpdated={setVoiceQuery}
        onProductView={handleVoiceProductView}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-black text-white">
      <div
        className={`mx-auto flex h-full w-full max-w-3xl flex-col ${
          cart.length > 0 ? "pb-24" : ""
        }`}
      >
        <Header
          onCameraClick={() => fileInputRef.current?.click()}
          onVoiceResult={handleQuery}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-0 flex-1 flex-col justify-center -translate-y-[5%]">
            <CategoryGrid
              activeCategory={activeCategory}
              onSelect={handleCategorySelect}
            />
          </div>

          <UploadedImages images={uploadedImages} />

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

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 px-5 pt-6">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Your upload"
                  className="size-16 rounded-lg border border-white/10 object-cover"
                />
              )}
              <p className="text-center text-sm text-neutral-400">
                Searching the catalog...
              </p>
            </div>
          )}
          {status === "error" && (
            <p className="px-5 pt-6 text-center text-sm text-red-400">
              {error}
            </p>
          )}
          {status === "done" && (
            <ResultsGrid
              matches={matches}
              onView={handleProductView}
              onAddToCart={handleAddToCart}
            />
          )}
          {orderMessage && (
            <p className="px-5 pt-6 text-center text-sm text-gold">
              {orderMessage}
            </p>
          )}
        </div>
      </div>

      <CartBar items={cart} onPlaceOrder={handlePlaceOrder} />
    </div>
  );
}

export default App;
