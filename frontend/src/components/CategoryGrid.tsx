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
      <div className="flex size-full items-center justify-center bg-gradient-to-b from-neutral-900 to-black">
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
      className="size-full object-cover"
    />
  );
}

export function CategoryGrid({ onSelect, activeCategory }: CategoryGridProps) {
  return (
    <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-2 px-3 py-4">
      {CATEGORIES.map(({ label, Icon }) => {
        const isActive = activeCategory === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect?.(isActive ? "" : label)}
            className={`relative h-full overflow-hidden rounded-xl border transition-colors ${
              isActive ? "border-gold" : "border-gold/40"
            }`}
          >
            <CategoryThumbnail label={label} Icon={Icon} />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-10 pb-4">
              <span className="text-sm font-bold tracking-wide text-white uppercase">
                {label}
              </span>
              <span className="h-px w-6 bg-gold/70" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
