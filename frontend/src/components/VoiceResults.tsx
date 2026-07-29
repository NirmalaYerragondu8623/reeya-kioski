import { useState } from "react";
import { voiceSearch, type VoiceMatch, type VoiceSearchResponse } from "../lib/api";
import {
  AGE_GROUP_OPTIONS,
  AGE_GROUP_VALUES,
  PRICE_BAND_OPTIONS,
  PRICE_BAND_VALUES,
  USAGE_OPTIONS,
  USAGE_VALUES,
  labelToValue,
  valueToLabel,
} from "../lib/preferenceOptions";
import { PillGroup } from "./RefineSearch";
import { ArrowLeftIcon, SlidersIcon, SparkleIcon } from "./icons";

interface VoiceResultsProps {
  transcript: string;
  initial: VoiceSearchResponse;
  onBack: () => void;
  onProductView?: (product: VoiceMatch) => void;
}

export function VoiceResults({ transcript, initial, onBack, onProductView }: VoiceResultsProps) {
  const [result, setResult] = useState(initial);
  const [ageGroup, setAgeGroup] = useState(
    valueToLabel(AGE_GROUP_OPTIONS, AGE_GROUP_VALUES, initial.extracted_filters.age_group),
  );
  const [priceBand, setPriceBand] = useState(
    valueToLabel(PRICE_BAND_OPTIONS, PRICE_BAND_VALUES, initial.extracted_filters.price_band),
  );
  const [usage, setUsage] = useState(
    valueToLabel(USAGE_OPTIONS, USAGE_VALUES, initial.extracted_filters.usage),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(next: {
    ageGroup?: string | null;
    priceBand?: string | null;
    usage?: string | null;
  }) {
    const nextAgeGroup = next.ageGroup !== undefined ? next.ageGroup : ageGroup;
    const nextPriceBand = next.priceBand !== undefined ? next.priceBand : priceBand;
    const nextUsage = next.usage !== undefined ? next.usage : usage;

    setAgeGroup(nextAgeGroup);
    setPriceBand(nextPriceBand);
    setUsage(nextUsage);
    setIsRefreshing(true);
    setError(null);
    try {
      const updated = await voiceSearch(transcript, {
        category: result.extracted_filters.category ?? undefined,
        age_group: labelToValue(AGE_GROUP_OPTIONS, AGE_GROUP_VALUES, nextAgeGroup),
        price_band: labelToValue(PRICE_BAND_OPTIONS, PRICE_BAND_VALUES, nextPriceBand),
        usage: labelToValue(USAGE_OPTIONS, USAGE_VALUES, nextUsage),
      });
      setResult(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update results — try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-black pb-16 text-white">
      <header className="relative px-5 pt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="absolute top-6 left-5 text-white"
        >
          <ArrowLeftIcon className="size-6" />
        </button>
        <h1
          className="flex items-center justify-center gap-2 text-3xl text-gold"
          style={{ fontFamily: "var(--font-serif-display)" }}
        >
          <SparkleIcon className="size-4" />
          Your Results
          <SparkleIcon className="size-4" />
        </h1>
        <p className="mx-auto mt-2 max-w-xs truncate text-sm text-neutral-400 italic">
          "{transcript}"
        </p>
      </header>

      <div className="mt-6 flex items-center gap-2 px-5">
        <SlidersIcon className="size-5 text-gold" />
        <h2 className="text-lg" style={{ fontFamily: "var(--font-serif-display)" }}>
          Adjust filters
        </h2>
      </div>

      <div className="mt-3 flex flex-col gap-3 px-5">
        <PillGroup
          options={AGE_GROUP_OPTIONS}
          value={ageGroup}
          onChange={(value) => refresh({ ageGroup: value })}
        />
        <PillGroup
          options={PRICE_BAND_OPTIONS}
          value={priceBand}
          onChange={(value) => refresh({ priceBand: value })}
        />
        <PillGroup
          options={USAGE_OPTIONS}
          value={usage}
          onChange={(value) => refresh({ usage: value })}
        />
      </div>

      {isRefreshing && (
        <p className="px-5 pt-6 text-center text-sm text-neutral-400">Updating results...</p>
      )}
      {error && <p className="px-5 pt-6 text-center text-sm text-red-400">{error}</p>}

      {!isRefreshing && !error && result.matches.length === 0 && (
        <p className="px-5 pt-6 text-center text-sm text-neutral-500">
          No products match these filters. Try adjusting them above.
        </p>
      )}

      {!isRefreshing && result.matches.length > 0 && (
        <section className="px-5 pt-6">
          <div className="grid grid-cols-2 gap-3">
            {result.matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => onProductView?.(match)}
                className="overflow-hidden rounded-xl border border-gold/40 bg-neutral-950 text-left"
              >
                <img
                  src={match.image_s3_url}
                  alt={match.name}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-white">{match.name}</p>
                  {match.price != null && (
                    <p className="text-[11px] text-gold/80">
                      ₹{Math.round(match.price).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
