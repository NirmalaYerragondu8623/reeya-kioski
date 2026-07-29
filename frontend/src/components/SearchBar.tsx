import { useState, type FormEvent } from "react";
import { SearchIcon } from "./icons";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 pt-5">
      <div className="flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2.5">
        <SearchIcon className="size-4 shrink-0 text-gold" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for rings, earrings, necklaces..."
          className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
        />
      </div>
    </form>
  );
}
