import { useState, type ComponentType, type SVGProps } from "react";
import { CATEGORY_IMAGES } from "../lib/categoryImages";
import {
  AGE_GROUP_OPTIONS,
  PRICE_BAND_OPTIONS,
  USAGE_OPTIONS,
} from "../lib/preferenceOptions";
import { startVoiceSearch } from "../lib/voiceSearch";
import { CATEGORIES } from "./CategoryGrid";
import {
  AccountIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  CloseIcon,
  DiamondIcon,
  FilterIcon,
  MicIcon,
  PencilIcon,
  PriceTagIcon,
  SparkleIcon,
} from "./icons";
import { RelatedDesigns } from "./RelatedDesigns";

export interface Preferences {
  ageGroup: string | null;
  priceBand: string | null;
  usage: string | null;
}

interface RefineSearchProps {
  category: string | null;
  voiceQuery: string | null;
  error?: string | null;
  isSubmitting?: boolean;
  onBack: () => void;
  onChangeCategory: () => void;
  onVoiceUpdated: (transcript: string) => void;
  onConfirm: (preferences: Preferences) => void;
}

export function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(isSelected ? null : option)}
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

interface FilterConfig {
  key: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

function FilterCard({
  Icon,
  title,
  options,
  value,
  onChange,
  isExpanded,
  onToggle,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-black">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col items-center gap-1 px-2 py-3 text-center"
      >
        <Icon className="size-5 shrink-0 text-gold" />
        <span className="text-[11px] leading-tight font-semibold text-white">
          {title}
        </span>
        <ChevronDownIcon
          className={`size-3.5 shrink-0 text-gold transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && (
        <div className="border-t border-gold/20 p-3">
          <PillGroup options={options} value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

export function RefineSearch({
  category,
  voiceQuery,
  error,
  isSubmitting,
  onBack,
  onChangeCategory,
  onVoiceUpdated,
  onConfirm,
}: RefineSearchProps) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(false);
  const [expandedFilterKeys, setExpandedFilterKeys] = useState<string[]>([
    "ageGroup",
  ]);

  const CategoryIcon = CATEGORIES.find((c) => c.label === category)?.Icon;

  const filters: FilterConfig[] = [
    {
      key: "ageGroup",
      Icon: AccountIcon,
      title: "Age Group",
      subtitle: "This helps us show designs that suit your style.",
      options: AGE_GROUP_OPTIONS,
      value: ageGroup,
      onChange: setAgeGroup,
    },
    {
      key: "priceBand",
      Icon: PriceTagIcon,
      title: "Price Band",
      subtitle: "Let us know your budget range.",
      options: PRICE_BAND_OPTIONS,
      value: priceBand,
      onChange: setPriceBand,
    },
    {
      key: "usage",
      Icon: DiamondIcon,
      title: "Usage",
      subtitle: "What's the primary use?",
      options: USAGE_OPTIONS,
      value: usage,
      onChange: setUsage,
    },
  ];

  function toggleFilterKey(key: string) {
    setExpandedFilterKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const selectedFilters = [
    { label: "Age Group", value: ageGroup },
    { label: "Price Band", value: priceBand },
    { label: "Usage", value: usage },
  ].filter(
    (filter): filter is { label: string; value: string } => filter.value !== null,
  );

  function handleRetryVoice() {
    if (isListening) return;
    setIsListening(true);
    startVoiceSearch(
      (transcript) => onVoiceUpdated(transcript),
      () => setIsListening(false),
      () => setIsListening(false),
    );
  }

  function handleResetPreferences() {
    setAgeGroup(null);
    setPriceBand(null);
    setUsage(null);
  }

  return (
    <div className="min-h-screen bg-black pb-32 text-white">
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
          Refine Your Search
          <SparkleIcon className="size-4" />
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-neutral-400">
          Help us understand your preferences so we can show you the most
          relevant designs.
        </p>
      </header>

      {(category || voiceQuery) && (
        <section className="mx-5 mt-6 rounded-2xl border border-gold/30 p-4">
          {category && (
            <div className="flex items-center gap-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-b from-neutral-900 to-black">
                {category && CATEGORY_IMAGES[category] ? (
                  <img
                    src={CATEGORY_IMAGES[category]}
                    alt={category}
                    className="size-full object-cover"
                  />
                ) : (
                  CategoryIcon && (
                    <div className="flex size-full items-center justify-center">
                      <CategoryIcon className="size-9 text-gold" />
                    </div>
                  )
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium tracking-wide text-gold uppercase">
                  You selected
                </p>
                <p
                  className="truncate text-2xl text-white"
                  style={{ fontFamily: "var(--font-serif-display)" }}
                >
                  {category}
                </p>
              </div>
              <button
                type="button"
                onClick={onChangeCategory}
                className="shrink-0 rounded-full border border-gold/60 px-3 py-1.5 text-xs text-gold"
              >
                Change
              </button>
            </div>
          )}

          {category && voiceQuery && <div className="my-4 h-px bg-gold/20" />}

          {voiceQuery && (
            <>
              <p className="text-xs text-neutral-500">
                Or searched via voice / text
              </p>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gold/25 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold">
                  <MicIcon className="size-4" />
                </span>
                <p className="flex-1 text-sm text-neutral-200 italic">
                  "{voiceQuery}"
                </p>
                <button
                  type="button"
                  onClick={handleRetryVoice}
                  className="shrink-0 rounded-full border border-gold/60 px-3 py-1.5 text-xs text-gold"
                >
                  {isListening ? "Listening…" : "Change"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <div className="mx-5 mt-6 rounded-2xl border border-gold/40 bg-black">
        <div
          onClick={() => setIsPreferencesExpanded((v) => !v)}
          className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
        >
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-wide text-gold uppercase">
            <FilterIcon className="size-4" />
            {selectedFilters.length > 0 ? "Selected" : "Preferences"}
          </span>

          {selectedFilters.length > 0 ? (
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              {selectedFilters.map((filter) => (
                <div
                  key={filter.label}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-gold/40 bg-[#1a1a1a] px-3 py-1.5"
                >
                  <span className="text-[10px] tracking-wide text-neutral-400 uppercase">
                    {filter.label}
                  </span>
                  <span className="h-3 w-px shrink-0 bg-gold/30" />
                  <span className="flex items-center gap-1 text-xs font-bold whitespace-nowrap text-white">
                    {filter.value}
                    <ChevronDownIcon className="size-3 shrink-0 text-gold" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="flex-1 text-xs text-neutral-500">
              Tap to tell us your preferences
            </span>
          )}

          {selectedFilters.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetPreferences();
              }}
              aria-label="Clear all filters"
              className="shrink-0 text-gold/70"
            >
              <CloseIcon className="size-4" />
            </button>
          )}

          <ChevronDownIcon
            className={`size-4 shrink-0 text-gold transition-transform ${
              isPreferencesExpanded ? "rotate-180" : ""
            }`}
          />
        </div>

        {isPreferencesExpanded && (
          <div className="grid grid-cols-3 items-start gap-2 border-t border-gold/20 px-3 py-4">
            {filters.map((filter) => (
              <FilterCard
                key={filter.key}
                Icon={filter.Icon}
                title={filter.title}
                options={filter.options}
                value={filter.value}
                onChange={filter.onChange}
                isExpanded={expandedFilterKeys.includes(filter.key)}
                onToggle={() => toggleFilterKey(filter.key)}
              />
            ))}
          </div>
        )}
      </div>

      <RelatedDesigns category={category} preferences={{ ageGroup, priceBand, usage }} />

      <div className="fixed inset-x-0 bottom-0 border-t border-gold/30 bg-black px-5 py-4">
        {error && (
          <p className="mx-auto max-w-md pb-2 text-center text-xs text-red-400">{error}</p>
        )}
        <div className="mx-auto flex max-w-md gap-3">
          <button
            type="button"
            onClick={handleResetPreferences}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/50 py-3 text-sm font-medium text-gold"
          >
            <PencilIcon className="size-4" />
            Edit Preferences
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm({ ageGroup, priceBand, usage })}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8860b] via-[#f5d78e] to-[#b8860b] py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {isSubmitting ? "Searching..." : "Yes, Show My Results"}
            {!isSubmitting && <ArrowRightIcon className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
