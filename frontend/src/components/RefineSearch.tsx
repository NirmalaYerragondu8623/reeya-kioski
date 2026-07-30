import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { voiceSearch, type VoiceMatch, type VoiceSearchResponse, type WishlistItem } from "../lib/api";
import { trackEvent } from "../lib/analytics";
import {
  AGE_GROUP_OPTIONS,
  AGE_GROUP_VALUES,
  PRICE_BAND_OPTIONS,
  PRICE_BAND_VALUES,
  USAGE_OPTIONS,
  USAGE_VALUES,
  labelsToValues,
} from "../lib/preferenceOptions";
import { startVoiceSearch } from "../lib/voiceSearch";
import {
  AccountIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  DiamondIcon,
  HeartIcon,
  PriceTagIcon,
  RefreshIcon,
} from "./icons";

export interface Preferences {
  ageGroup: string[];
  priceBand: string[];
  usage: string[];
}

interface RefineSearchProps {
  category: string | null;
  voiceQuery: string | null;
  onBack: () => void;
  onVoiceUpdated: (transcript: string) => void;
  onProductView?: (product: VoiceMatch) => void;
  onToggleWishlist?: (product: WishlistItem) => void;
  wishlistIds?: Set<string>;
  onNewUser?: () => void;
}

export function PillGroup({
  options,
  value,
  onToggle,
}: {
  options: string[];
  value: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              isSelected
                ? "border-gold bg-gold text-black"
                : "border-gold/40 text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function toggleValue(list: string[], option: string): string[] {
  return list.includes(option) ? list.filter((v) => v !== option) : [...list, option];
}

interface FilterConfig {
  key: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  options: string[];
  value: string[];
  onToggle: (option: string) => void;
}

export function RefineSearch({
  category,
  voiceQuery,
  onBack,
  onVoiceUpdated,
  onProductView,
  onToggleWishlist,
  wishlistIds,
  onNewUser,
}: RefineSearchProps) {
  const [ageGroup, setAgeGroup] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState<string[]>([]);
  const [usage, setUsage] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);

  const [result, setResult] = useState<VoiceSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    // A filter dropdown is still open — the user may still be picking more
    // than one option, so don't fire a request per individual tap. Only the
    // dropdown closing (openFilterKey back to null) commits the selection
    // and triggers the fetch below.
    if (openFilterKey !== null) return;

    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await voiceSearch(voiceQuery ?? "", {
          category: category ?? undefined,
          age_group: labelsToValues(AGE_GROUP_OPTIONS, AGE_GROUP_VALUES, ageGroup),
          price_band: labelsToValues(PRICE_BAND_OPTIONS, PRICE_BAND_VALUES, priceBand),
          usage: labelsToValues(USAGE_OPTIONS, USAGE_VALUES, usage),
        });
        if (!cancelled) setResult(response);
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : "Something went wrong searching for that.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [category, voiceQuery, ageGroup, priceBand, usage, openFilterKey]);

  const filters: FilterConfig[] = [
    {
      key: "ageGroup",
      Icon: AccountIcon,
      title: "Age Group",
      options: AGE_GROUP_OPTIONS,
      value: ageGroup,
      onToggle: (option) => setAgeGroup((prev) => toggleValue(prev, option)),
    },
    {
      key: "priceBand",
      Icon: PriceTagIcon,
      title: "Price Band",
      options: PRICE_BAND_OPTIONS,
      value: priceBand,
      onToggle: (option) => setPriceBand((prev) => toggleValue(prev, option)),
    },
    {
      key: "usage",
      Icon: DiamondIcon,
      title: "Usage",
      options: USAGE_OPTIONS,
      value: usage,
      onToggle: (option) => setUsage((prev) => toggleValue(prev, option)),
    },
  ];

  function handleRetryVoice() {
    if (isListening) return;
    onVoiceUpdated("");
    setIsListening(true);
    stopVoiceRef.current = startVoiceSearch(
      (transcript) => onVoiceUpdated(transcript),
      () => setIsListening(false),
      () => setIsListening(false),
    );
  }

  function handleEndVoiceInput() {
    stopVoiceRef.current?.();
    setIsListening(false);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl pb-28">
        <header className="relative px-5 pt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute top-6 left-5 text-white"
          >
            <ArrowLeftIcon className="size-6" />
          </button>
          <button
            type="button"
            onClick={onNewUser}
            className="absolute top-6 right-5 flex shrink-0 items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5 text-sm font-medium text-gold/80"
          >
            <RefreshIcon className="size-5" />
            New User
          </button>
          <h1
            className="text-3xl text-gold"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            {category ?? "Search Results"}
          </h1>
        </header>

        {(voiceQuery || isListening) && (
          <section className="mx-5 mt-4 rounded-2xl border border-white/10 p-4">
            <p className="text-xs text-neutral-500">Searched via voice / text</p>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 p-3">
              <p className="flex-1 text-sm text-neutral-200 italic">
                {voiceQuery ? `"${voiceQuery}"` : "Listening..."}
              </p>
              <button
                type="button"
                onClick={isListening ? handleEndVoiceInput : handleRetryVoice}
                className="shrink-0 rounded-full border border-gold/60 px-3 py-1.5 text-xs text-gold"
              >
                {isListening ? (voiceQuery ? "Search" : "Stop") : "Change"}
              </button>
            </div>
          </section>
        )}

        {openFilterKey && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpenFilterKey(null)}
          />
        )}

        <div className="relative z-20 mx-5 mt-6 flex gap-2">
          {filters.map((filter) => {
            const isOpen = openFilterKey === filter.key;
            return (
              <div key={filter.key} className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setOpenFilterKey(isOpen ? null : filter.key)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center ${
                    isOpen || filter.value.length > 0 ? "border-white/40" : "border-white/10"
                  }`}
                >
                  <filter.Icon className="size-5 shrink-0 text-gold" />
                  <span className="truncate text-[11px] font-semibold text-white">
                    {filter.value.length === 0
                      ? filter.title
                      : filter.value.length === 1
                        ? filter.value[0]
                        : `${filter.title} (${filter.value.length})`}
                  </span>
                  <ChevronDownIcon
                    className={`size-3.5 shrink-0 text-gold transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl border border-white/10 bg-black p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                    <PillGroup
                      options={filter.options}
                      value={filter.value}
                      onToggle={(option) => {
                        const willBeSelected = !filter.value.includes(option);
                        filter.onToggle(option);
                        trackEvent("filter_applied", {
                          filter_type: filter.key,
                          value: option,
                          selected: willBeSelected,
                          category,
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <p className="px-5 pt-6 text-center text-sm text-neutral-400">
            Loading results...
          </p>
        )}
        {fetchError && (
          <p className="px-5 pt-6 text-center text-sm text-red-400">{fetchError}</p>
        )}
        {!isLoading && !fetchError && result && result.matches.length === 0 && (
          <p className="px-5 pt-6 text-center text-sm text-neutral-500">
            No results found.
          </p>
        )}
        {!isLoading && !fetchError && result && result.matches.length > 0 && (
          <section className="px-5 pt-6">
            <div className="grid grid-cols-3 gap-3">
              {result.matches.map((match) => {
                const isWishlisted = wishlistIds?.has(match.id) ?? false;
                return (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => onProductView?.(match)}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-neutral-950 text-left"
                >
                  <img
                    src={match.image_s3_url}
                    alt={match.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist?.(match);
                    }}
                    aria-label={
                      isWishlisted
                        ? `Remove ${match.name} from wishlist`
                        : `Add ${match.name} to wishlist`
                    }
                    className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full border border-gold/60 bg-black/70 text-gold"
                  >
                    <HeartIcon
                      className="size-3.5"
                      fill={isWishlisted ? "white" : "none"}
                    />
                  </button>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-medium text-white">{match.name}</p>
                    {match.price != null && (
                      <p className="text-[11px] text-gold/80">
                        ₹{Math.round(match.price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
