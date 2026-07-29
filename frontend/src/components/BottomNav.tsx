import type { ComponentType, SVGProps } from "react";
import { AccountIcon, DiamondIcon, HeartIcon, SearchIcon } from "./icons";

interface NavItem {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Products", Icon: DiamondIcon },
  { label: "Wishlist", Icon: HeartIcon },
  { label: "Search", Icon: SearchIcon },
  { label: "Account", Icon: AccountIcon },
];

interface BottomNavProps {
  active: string;
  onSelect: (label: string) => void;
}

export function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-gold/30 bg-black">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
        {NAV_ITEMS.map(({ label, Icon }) => {
          const isActive = label === active;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className={`flex flex-col items-center gap-1 text-[11px] ${
                isActive ? "text-gold" : "text-neutral-400"
              }`}
            >
              <Icon className="size-6" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
