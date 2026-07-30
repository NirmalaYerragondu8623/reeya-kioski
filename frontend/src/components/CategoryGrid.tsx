import { useState, type ComponentType, type SVGProps } from "react";
import { CATEGORY_IMAGES } from "../lib/categoryImages";
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

function CategoryThumbnail({
  label,
  Icon,
}: {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = CATEGORY_IMAGES[label];

  if (!imageSrc || imageFailed) {
    return (
      <div className="flex size-full items-center justify-center bg-neutral-950">
        <Icon className="size-10 text-gold" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={label}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="size-full object-contain p-3"
    />
  );
}

export function CategoryGrid({ onSelect, activeCategory }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-2 px-5 py-4">
      {CATEGORIES.map(({ label, Icon }) => {
        const isActive = activeCategory === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect?.(isActive ? "" : label)}
            className="flex flex-col items-center gap-0.5"
          >
            <div
              className={`aspect-square w-full overflow-hidden rounded-xl border-2 bg-neutral-950 transition-colors ${
                isActive ? "border-gold" : "border-black"
              }`}
            >
              <CategoryThumbnail label={label} Icon={Icon} />
            </div>
            <span className="shrink-0 font-category text-xs tracking-wide text-gold">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
