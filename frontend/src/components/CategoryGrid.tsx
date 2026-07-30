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
      <div className="flex size-full items-center justify-center bg-black">
        <Icon className="size-16 text-gold" />
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

function CategoryTile({
  label,
  Icon,
  isActive,
  onSelect,
}: {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: boolean;
  onSelect?: (label: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(isActive ? "" : label)}
      className="flex min-w-0 flex-1 flex-col items-center gap-3"
    >
      <div
        className={`aspect-square w-full overflow-hidden rounded-2xl border-2 bg-black transition-colors ${
          isActive ? "border-gold" : "border-black"
        }`}
      >
        <CategoryThumbnail label={label} Icon={Icon} />
      </div>
      <span className="shrink-0 font-category text-[25px] tracking-[2px] text-gold">
        {label}
      </span>
    </button>
  );
}

export function CategoryGrid({ onSelect, activeCategory }: CategoryGridProps) {
  const topRow = CATEGORIES.slice(0, 3);
  const bottomRow = CATEGORIES.slice(3, 6);

  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-start gap-48 px-10 pt-[126px]">
      {[topRow, bottomRow].map((row, i) => (
        <div key={i} className="flex w-full gap-8">
          {row.map(({ label, Icon }) => (
            <CategoryTile
              key={label}
              label={label}
              Icon={Icon}
              isActive={activeCategory === label}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
