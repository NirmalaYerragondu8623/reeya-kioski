import { useState, type ComponentType, type SVGProps } from "react";
import { startVoiceSearch } from "../lib/voiceSearch";
import { CATEGORIES } from "./CategoryGrid";
import {
  AccountIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DiamondIcon,
  MicIcon,
  PencilIcon,
  PriceTagIcon,
  SlidersIcon,
  SparkleIcon,
} from "./icons";

const AGE_GROUPS = ["Below 18", "18 – 25", "26 – 35", "36 – 45", "Above 45"];
const PRICE_BANDS = [
  "Below ₹10K",
  "₹10K – ₹25K",
  "₹25K – ₹50K",
  "₹50K – ₹1L",
  "Above ₹1L",
];
const USAGE_OPTIONS = [
  "Daily Wear",
  "Office Wear",
  "Party Wear",
  "Festive",
  "Bridal",
];

export interface Preferences {
  ageGroup: string | null;
  priceBand: string | null;
  usage: string | null;
}

interface RefineSearchProps {
  category: string | null;
  voiceQuery: string | null;
  onBack: () => void;
  onChangeCategory: () => void;
  onVoiceUpdated: (transcript: string) => void;
  onConfirm: (preferences: Preferences) => void;
}

function PillGroup({
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

function PreferenceCard({
  Icon,
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-gold/30 p-4">
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-6 shrink-0 text-gold" />
        <div>
          <p className="text-sm font-semibold text-white">
            {title}{" "}
            <span className="text-xs font-normal text-neutral-500">
              (Optional)
            </span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-3">
        <PillGroup options={options} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export function RefineSearch({
  category,
  voiceQuery,
  onBack,
  onChangeCategory,
  onVoiceUpdated,
  onConfirm,
}: RefineSearchProps) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const CategoryIcon = CATEGORIES.find((c) => c.label === category)?.Icon;

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
              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-gold/40 bg-gradient-to-b from-neutral-900 to-black">
                {CategoryIcon && <CategoryIcon className="size-9 text-gold" />}
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

      <div className="mt-7 flex items-center gap-2 px-5">
        <SlidersIcon className="size-5 text-gold" />
        <h2
          className="text-xl"
          style={{ fontFamily: "var(--font-serif-display)" }}
        >
          Tell us your preferences
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-4 px-5">
        <PreferenceCard
          Icon={AccountIcon}
          title="Age Group"
          subtitle="This helps us show designs that suit your style."
          options={AGE_GROUPS}
          value={ageGroup}
          onChange={setAgeGroup}
        />
        <PreferenceCard
          Icon={PriceTagIcon}
          title="Price Band"
          subtitle="Let us know your budget range."
          options={PRICE_BANDS}
          value={priceBand}
          onChange={setPriceBand}
        />
        <PreferenceCard
          Icon={DiamondIcon}
          title="Usage"
          subtitle="What's the primary use?"
          options={USAGE_OPTIONS}
          value={usage}
          onChange={setUsage}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-gold/30 bg-black px-5 py-4">
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
            onClick={() => onConfirm({ ageGroup, priceBand, usage })}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8860b] via-[#f5d78e] to-[#b8860b] py-3 text-sm font-semibold text-black"
          >
            Yes, Show My Results
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
