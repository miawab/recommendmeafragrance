"use client";

import { useEffect, useMemo, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { loadFullCatalog } from "@/lib/catalog";
import { getHistory, getShelf, getStreak, type ShelfItem, type StreakState } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { useOffers } from "@/lib/useOffers";

const DAILY_GAMES: { key: string; label: string }[] = [
  { key: "scentle", label: "Scentle" },
  { key: "detective", label: "Note Detective" },
];
const CALENDAR_DAYS = 14;
const EMPTY_STREAK: StreakState = { current: 0, best: 0, lastPlayedDate: null };

interface GameProgress {
  streak: StreakState;
  history: Record<string, unknown>;
}

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function ShelfPage() {
  const [catalog, setCatalog] = useState<PerfumeEntry[]>([]);
  const [shelf, setShelf] = useState<ShelfItem[]>([]);
  const [progress, setProgress] = useState<Record<string, GameProgress>>({});
  const offers = useOffers();

  useEffect(() => {
    loadFullCatalog().then(setCatalog);
    setShelf(getShelf());
    const next: Record<string, GameProgress> = {};
    for (const { key } of DAILY_GAMES) {
      next[key] = { streak: getStreak(key), history: getHistory(key) };
    }
    setProgress(next);
  }, []);

  const famousCount = useMemo(() => catalog.filter((p) => p.tier === "famous").length, [catalog]);
  const shelfEntries = useMemo(
    () =>
      shelf
        .map((s) => ({ item: s, perfume: catalog.find((p) => p.id === s.perfumeId) }))
        .filter((e): e is { item: ShelfItem; perfume: PerfumeEntry } => !!e.perfume),
    [shelf, catalog]
  );
  const famousOwned = shelfEntries.filter((e) => e.perfume.tier === "famous").length;
  const collectionPct = famousCount > 0 ? Math.round((famousOwned / famousCount) * 100) : 0;

  const dates = useMemo(() => lastNDates(CALENDAR_DAYS), []);

  return (
    <div className="flex flex-col gap-9">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">Your Shelf</h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Everything you&apos;ve discovered across every game.
        </p>
      </div>

      <div className="rounded-3xl bg-ink-950 p-7 text-cream-100 shadow-card-lg">
        <p className="flex items-center gap-1.5 text-base font-bold text-cream-300/70">
          Famous-tier collection
          <InfoTooltip label="What this percentage means">
            <p className="font-extrabold text-ink-950 mb-2">Famous-tier collection</p>
            <p>
              We keep a &quot;famous&quot; tier of {famousCount || "~300"} widely-known
              fragrances. This is the percentage of those you&apos;ve discovered by playing any
              game, guessing them, winning them in Roulette, or matching them in other games all
              count.
            </p>
          </InfoTooltip>
        </p>
        <p className="font-display text-6xl font-extrabold text-amber-400 mt-1">{collectionPct}%</p>
        <p className="text-base font-medium text-cream-300/60 mt-2">
          {famousOwned} of {famousCount} famous fragrances discovered
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-widest text-ink-400">
          Daily streaks
          <InfoTooltip label="How streaks work">
            <p className="font-extrabold text-ink-950 mb-2">Streaks</p>
            <p>
              Each filled square is a day you played that game&apos;s daily puzzle. Solve it
              correctly and play again the very next day to keep your streak climbing, miss a
              day and it resets to zero.
            </p>
          </InfoTooltip>
        </p>
        {DAILY_GAMES.map(({ key, label }) => {
          const { streak, history } = progress[key] ?? { streak: EMPTY_STREAK, history: {} };
          return (
            <div key={key} className="rounded-2xl border-2 border-ink-950/8 bg-cream-100 p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-lg font-extrabold text-ink-950">{label}</span>
                <span className="text-sm font-bold text-ink-400">
                  {streak.current} 🔥 current, {streak.best} best
                </span>
              </div>
              {/* h-4/gap-1 on mobile (not h-5/gap-1.5): 14 squares at the
                  larger size need ~358px, more than fits inside this card on
                  a 390px phone after container + card padding, and would
                  silently overflow the rounded border. */}
              <div className="mt-4 flex gap-1 sm:gap-1.5">
                {dates.map((d) => {
                  const entry = history[d] as { completed?: boolean } | undefined;
                  return (
                    <span
                      key={d}
                      title={d}
                      className={`h-4 w-4 shrink-0 rounded-md sm:h-5 sm:w-5 ${entry?.completed ? "bg-amber-400" : "bg-ink-950/10"}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400">
          Discovered ({shelfEntries.length})
        </p>
        {shelfEntries.length === 0 && (
          <p className="text-base font-medium text-ink-400">
            Nothing here yet. Go play a game to start filling your shelf.
          </p>
        )}
        {shelfEntries.map(({ item, perfume }) => (
          <ResultCard
            key={item.perfumeId}
            perfume={perfume}
            surface="shelf"
            offer={offers[perfume.id]}
          />
        ))}
      </div>
    </div>
  );
}
