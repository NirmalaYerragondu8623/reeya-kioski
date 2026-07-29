import { useEffect, useRef, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { CATEGORY_LABELS, CategoryGrid } from "./components/CategoryGrid";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { RefineSearch, type Preferences } from "./components/RefineSearch";
import { ResultsGrid } from "./components/ResultsGrid";
import { UploadPanel } from "./components/UploadPanel";
import { findSimilarProducts, type ProductMatch } from "./lib/api";

type Status = "idle" | "loading" | "done" | "error";
type View = "landing" | "products" | "refine";

function App() {
  const [view, setView] = useState<View>("landing");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [voiceQuery, setVoiceQuery] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Products");
  const [scrollToUploadPending, setScrollToUploadPending] = useState(false);
  const uploadPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "products" && scrollToUploadPending) {
      uploadPanelRef.current?.scrollIntoView({ behavior: "smooth" });
      setScrollToUploadPending(false);
    }
  }, [view, scrollToUploadPending]);

  function handleVoiceResult(transcript: string) {
    setVoiceQuery(transcript);
    const spoken = transcript.toLowerCase();
    const matched = CATEGORY_LABELS.find((label) =>
      spoken.includes(label.toLowerCase()),
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
    setView("refine");
  }

  function handleConfirmPreferences(_preferences: Preferences) {
    // Preferences are collected client-side only for now — the backend's
    // /image-search endpoint currently only accepts a category filter.
    setView("products");
    setScrollToUploadPending(true);
  }

  async function handleSelect(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
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

  if (view === "landing") {
    return <LandingPage onEnter={() => setView("products")} />;
  }

  if (view === "refine") {
    return (
      <RefineSearch
        category={activeCategory}
        voiceQuery={voiceQuery}
        onBack={() => setView("products")}
        onChangeCategory={() => {
          setActiveCategory(null);
          setView("products");
        }}
        onVoiceUpdated={setVoiceQuery}
        onConfirm={handleConfirmPreferences}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md pb-28">
        <Header
          onCameraClick={() =>
            uploadPanelRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          onVoiceResult={handleVoiceResult}
        />

        <CategoryGrid
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
        />

        <div ref={uploadPanelRef}>
          <UploadPanel
            onSelect={handleSelect}
            disabled={status === "loading"}
            previewUrl={previewUrl}
          />
        </div>

        {status === "loading" && (
          <p className="px-5 pt-6 text-center text-sm text-neutral-400">
            Searching the catalog...
          </p>
        )}
        {status === "error" && (
          <p className="px-5 pt-6 text-center text-sm text-red-400">
            {error}
          </p>
        )}
        {status === "done" && <ResultsGrid matches={matches} />}
      </div>

      <BottomNav active={activeTab} onSelect={setActiveTab} />
    </div>
  );
}

export default App;
