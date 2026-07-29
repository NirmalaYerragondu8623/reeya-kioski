import type { ComponentType, SVGProps } from "react";
import {
  BangleIcon,
  BraceletIcon,
  EarringsIcon,
  NecklaceIcon,
  PendantIcon,
  RingIcon,
} from "./icons";

export interface Category {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const CATEGORIES: Category[] = [
  { label: "Earrings", Icon: EarringsIcon },
  { label: "Pendants", Icon: PendantIcon },
  { label: "Necklace", Icon: NecklaceIcon },
  { label: "Rings", Icon: RingIcon },
  { label: "Bangles", Icon: BangleIcon },
  { label: "Bracelets", Icon: BraceletIcon },
];

export const CATEGORY_LABELS = CATEGORIES.map((category) => category.label);

interface CategoryGridProps {
  onSelect?: (label: string) => void;
  activeCategory?: string | null;
}

export function CategoryGrid({ onSelect, activeCategory }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-5 pt-6">
      {CATEGORIES.map(({ label, Icon }) => {
        const isActive = activeCategory === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect?.(isActive ? "" : label)}
            className={`flex flex-col items-center gap-3 rounded-xl border bg-gradient-to-b from-neutral-900 to-black px-2 py-5 transition-colors ${
              isActive ? "border-gold" : "border-gold/40"
            }`}
          >
            <Icon className="size-10 text-gold" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-bold tracking-wide text-white uppercase">
                {label}
              </span>
              <span className="h-px w-5 bg-gold/70" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
