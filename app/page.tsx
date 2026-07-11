"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Dices, FlaskConical, Heart, Search, Sparkles, SprayCan, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import GameIcon from "@/components/GameIcon";
import { loadCoreCatalog } from "@/lib/catalog";
import { getHistory, getShelf } from "@/lib/shelf";
import { todayUTC } from "@/lib/seededRandom";
import type { PerfumeEntry } from "@/lib/types";

const DAILY_GAMES = [
  {
    key: "scentle",
    href: "/scentle",
    label: "Scentle",
    blurb: "Wordle for fragrances. 6 guesses.",
    icon: SprayCan,
    tone: "bg-ink-950 text-cream-100",
  },
  {
    key: "detective",
    href: "/detective",
    label: "Note Detective",
    blurb: "Notes reveal from the base up.",
    icon: Search,
    tone: "bg-ink-400 text-cream-100",
  },
];

// Icon badges cycle through the palette's three non-cream tones only
// (caramel, warm brown, dark chocolate), no outside hues.
const GAME_GRID = [
  { href: "/scentle", label: "Scentle", blurb: "Today's daily puzzle.", icon: SprayCan, tone: "bg-ink-950 text-cream-100" },
  { href: "/detective", label: "Note Detective", blurb: "Sniff it out from the notes.", icon: Search, tone: "bg-ink-400 text-cream-100" },
  { href: "/build", label: "Build-a-Bottle", blurb: "Pick notes, invent a scent.", icon: FlaskConical, tone: "bg-amber-400 text-white" },
  { href: "/higher-lower", label: "Higher or Lower", blurb: "Keep the streak alive.", icon: TrendingUp, tone: "bg-ink-950 text-cream-100" },
  { href: "/roulette", label: "Scent Roulette", blurb: "Set the dials, pull the lever.", icon: Dices, tone: "bg-ink-400 text-cream-100" },
  { href: "/blind-date", label: "Blind Date", blurb: "Swipe to buy or skip. Trust your nose.", icon: Heart, tone: "bg-amber-400 text-white" },
];

export default function Home() {
  const [catalog, setCatalog] = useState<PerfumeEntry[]>([]);
  const [shelfCount, setShelfCount] = useState(0);
  const [completedToday, setCompletedToday] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCoreCatalog().then(setCatalog);
    setShelfCount(getShelf().length);
    const date = todayUTC();
    const state: Record<string, boolean> = {};
    for (const g of DAILY_GAMES) {
      const entry = getHistory(g.key)[date] as { completed?: boolean } | undefined;
      state[g.key] = !!entry?.completed;
    }
    setCompletedToday(state);
  }, []);

  const famousCount = useMemo(() => catalog.length, [catalog]);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-widest text-amber-600">
          six games. one nose.
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] sm:leading-[1.05] text-ink-950 mt-2">
          play a game, find your next fragrance.
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-3">
          Zero-cost games plus one AI concierge, and a shelf that fills up as you go.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400">
          Today&apos;s dailies
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DAILY_GAMES.map((g) => (
            <Link
              key={g.key}
              href={g.href}
              className="group tap-target rounded-3xl border-2 border-ink-950/8 bg-cream-100 p-6 shadow-card hover:shadow-card-lg hover:-translate-y-1 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GameIcon icon={g.icon} tone={g.tone} />
                  <span className="font-display text-2xl font-extrabold text-ink-950">{g.label}</span>
                </div>
                {completedToday[g.key] && (
                  <Badge className="bg-hit/15 text-hit border-hit/30">done</Badge>
                )}
              </div>
              <p className="text-base font-medium text-ink-400 mt-1.5">{g.blurb}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400">All games</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {GAME_GRID.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              className="group tap-target rounded-3xl border-2 border-ink-950/8 bg-cream-100 p-5 shadow-card hover:shadow-card-lg hover:-translate-y-1 active:scale-[0.98] transition-all"
            >
              <GameIcon icon={g.icon} tone={g.tone} className="mb-3" />
              <p className="text-lg font-extrabold text-ink-950">{g.label}</p>
              <p className="text-sm font-medium text-ink-400 mt-1">{g.blurb}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/shelf"
          className="group tap-target rounded-3xl bg-ink-950 p-6 text-cream-100 shadow-card hover:shadow-card-lg hover:-translate-y-1 active:scale-[0.98] transition-all"
        >
          <GameIcon icon={Trophy} tone="bg-cream-100 text-ink-950" className="mb-3" />
          <p className="font-display text-2xl font-extrabold">Your shelf</p>
          <p className="text-base font-medium text-cream-300/70 mt-1.5">
            {shelfCount} discovered{famousCount > 0 ? ` of ${famousCount} famous fragrances` : ""}
          </p>
        </Link>
        <Link
          href="/chat"
          className="group tap-target rounded-3xl bg-amber-400 p-6 text-ink-950 shadow-card hover:shadow-card-lg hover:-translate-y-1 active:scale-[0.98] transition-all"
        >
          <GameIcon icon={Sparkles} tone="bg-ink-950 text-cream-100" className="mb-3" />
          <p className="font-display text-2xl font-extrabold">Ask the Concierge</p>
          <p className="text-base font-medium text-ink-900/70 mt-1.5">Tell it what you like, get picks.</p>
        </Link>
      </div>
    </div>
  );
}
