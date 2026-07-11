"use client";

import { useEffect, useMemo, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";
import { loadFullCatalog, loadNotes } from "@/lib/catalog";
import { findClosestMatches, type Match } from "@/lib/jaccard";
import { buildNotePalette, type NotePalette } from "@/lib/notePalette";
import { addToShelf } from "@/lib/shelf";
import type { NoteEntry, PerfumeEntry } from "@/lib/types";
import { useOffers } from "@/lib/useOffers";

type Layer = "top" | "heart" | "base";
const LAYER_LABEL: Record<Layer, string> = { top: "Top", heart: "Heart", base: "Base" };
const MIN_PER_LAYER = 1;

export default function BuildABottlePage() {
  const [catalog, setCatalog] = useState<PerfumeEntry[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [selected, setSelected] = useState<Record<Layer, string[]>>({
    top: [],
    heart: [],
    base: [],
  });
  const [results, setResults] = useState<Match[] | null>(null);
  const [search, setSearch] = useState<Record<Layer, string>>({ top: "", heart: "", base: "" });
  const offers = useOffers();

  useEffect(() => {
    Promise.all([loadFullCatalog(), loadNotes()]).then(([c, n]) => {
      setCatalog(c);
      setNotes(n);
    });
    track("game_start", { game: "bab" });
  }, []);

  const palette: NotePalette = useMemo(() => {
    if (catalog.length === 0 || notes.length === 0) return { top: [], heart: [], base: [] };
    return buildNotePalette(catalog, notes);
  }, [catalog, notes]);

  function toggle(layer: Layer, note: string) {
    setSelected((prev) => {
      const current = prev[layer];
      if (current.includes(note)) {
        return { ...prev, [layer]: current.filter((n) => n !== note) };
      }
      return { ...prev, [layer]: [...current, note] };
    });
  }

  const ready =
    selected.top.length >= MIN_PER_LAYER &&
    selected.heart.length >= MIN_PER_LAYER &&
    selected.base.length >= MIN_PER_LAYER;

  function invent() {
    const matches = findClosestMatches(selected, catalog, 3);
    setResults(matches);
    matches.forEach((m) => addToShelf(m.perfume.id, "bab"));
    track("game_complete", { game: "bab", topMatch: matches[0]?.perfume.id });
  }

  function reset() {
    setSelected({ top: [], heart: [], base: [] });
    setResults(null);
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
            Build-a-Bottle
          </h1>
          <InfoTooltip label="How matching works">
            <p className="font-extrabold text-ink-950 mb-2">How we find your match</p>
            <p>
              We compare your notes against every fragrance in the catalog. Base notes count
              1.5x as much as top or heart notes, since they carry a scent&apos;s identity the
              most. The closest match is what you &quot;invented,&quot; plus two runners-up. Pick
              as many notes as you like per section, the more you pick, the more precise the
              match.
            </p>
          </InfoTooltip>
        </div>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Pick at least 1 top, 1 heart, and 1 base note. We&apos;ll tell you what you just invented.
        </p>
      </div>

      {!results && (
        <div className="flex flex-col gap-6">
          {(["top", "heart", "base"] as Layer[]).map((layer) => {
            const q = search[layer].trim().toLowerCase();
            const layerNotes = q
              ? palette[layer].filter((note) => note.replace(/-/g, " ").includes(q))
              : palette[layer];
            return (
              <div key={layer}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400">
                    {LAYER_LABEL[layer]} notes ({selected[layer].length} selected)
                  </p>
                  <Input
                    value={search[layer]}
                    onChange={(e) =>
                      setSearch((prev) => ({ ...prev, [layer]: e.target.value }))
                    }
                    placeholder="Search..."
                    className="h-9 w-32 shrink-0 px-3 text-sm sm:w-40"
                  />
                </div>
                <div className="flex flex-wrap gap-2.5 max-h-44 overflow-y-auto pr-1">
                  {layerNotes.map((note) => {
                    const active = selected[layer].includes(note);
                    return (
                      <button
                        key={note}
                        onClick={() => toggle(layer, note)}
                        className={`tap-target rounded-full border-[3px] px-4 py-2 text-sm font-bold transition-all active:scale-90 ${
                          active
                            ? "border-amber-400 bg-amber-400 text-ink-950 scale-105 shadow-card animate-pop-in"
                            : "border-ink-950/15 bg-cream-100 text-ink-900 hover:border-ink-950 hover:scale-105"
                        }`}
                      >
                        {note.replace(/-/g, " ")}
                      </button>
                    );
                  })}
                  {layerNotes.length === 0 && (
                    <p className="py-2 text-sm font-medium text-ink-400">No notes match.</p>
                  )}
                </div>
              </div>
            );
          })}

          <Button onClick={invent} disabled={!ready} size="lg" className="self-start">
            Invent my scent
          </Button>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-5">
          {results.map((m, i) => (
            <ResultCard
              key={m.perfume.id}
              perfume={m.perfume}
              surface="bab"
              offer={offers[m.perfume.id]}
              revealDelay={i * 150 + 30}
              headline={
                i === 0
                  ? `You just invented ${m.perfume.name}, ${Math.round(m.similarity * 100)}% match`
                  : `Runner-up, ${Math.round(m.similarity * 100)}% match`
              }
            />
          ))}
          <Button onClick={reset} variant="outline" size="lg" className="self-start">
            Try another blend
          </Button>
        </div>
      )}
    </div>
  );
}
