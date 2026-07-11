"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { PerfumeEntry } from "@/lib/types";

interface AutocompleteProps {
  catalog: PerfumeEntry[];
  onSelect: (perfume: PerfumeEntry) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: Set<string>;
}

export default function Autocomplete({
  catalog,
  onSelect,
  placeholder = "Guess a perfume...",
  disabled,
  excludeIds,
}: AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const fuse = useMemo(
    () =>
      new Fuse(catalog, {
        keys: [
          { name: "name", weight: 0.6 },
          { name: "brand", weight: 0.4 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [catalog]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse
      .search(query)
      .map((r) => r.item)
      .filter((p) => !excludeIds?.has(p.id))
      .slice(0, 8);
  }, [fuse, query, excludeIds]);

  useEffect(() => setActiveIndex(0), [query]);

  function pick(p: PerfumeEntry) {
    onSelect(p);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      <Input
        type="text"
        inputMode="search"
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(results[activeIndex]);
          }
        }}
        className="tap-target"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border-[3px] border-ink-950/15 bg-card shadow-card-lg max-h-80 overflow-y-auto animate-pop-in">
          {results.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                className={`w-full text-left px-5 py-4 text-base tap-target transition-all active:scale-[0.97] ${
                  i === activeIndex ? "bg-amber-100" : "hover:bg-cream-200"
                }`}
              >
                <span className="font-bold text-ink-950">{p.name}</span>
                <span className="text-ink-400 font-medium"> — {p.brand}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
