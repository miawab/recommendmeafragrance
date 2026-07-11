"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import SwipeCard from "@/components/SwipeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { loadFullCatalog } from "@/lib/catalog";
import { drawBottle } from "@/lib/higherLower";
import { addToShelf } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { useOffers } from "@/lib/useOffers";

const ROUND_SIZE = 10;
const PRICE_LABELS = ["", "Budget", "Mid-Range", "Designer", "Niche", "Ultra"];

interface Decision {
  perfume: PerfumeEntry;
  bought: boolean;
}

function drawRound(famous: PerfumeEntry[], full: PerfumeEntry[]): PerfumeEntry[] {
  const chosen: PerfumeEntry[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (chosen.length < ROUND_SIZE && attempts < 500) {
    attempts++;
    const p = drawBottle(famous, full);
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    chosen.push(p);
  }
  return chosen;
}

export default function BlindDatePage() {
  const [pool, setPool] = useState<PerfumeEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [phase, setPhase] = useState<"playing" | "reveal">("playing");
  const offers = useOffers();

  useEffect(() => {
    loadFullCatalog().then((catalog) => {
      const famous = catalog.filter((p) => p.tier === "famous");
      setPool(drawRound(famous, catalog));
    });
    track("game_start", { game: "blind" });
  }, []);

  function decide(bought: boolean) {
    const perfume = pool[index];
    const next = [...decisions, { perfume, bought }];
    setDecisions(next);
    if (index + 1 >= pool.length) {
      setPhase("reveal");
      const bought = next.filter((d) => d.bought);
      bought.forEach((d) => addToShelf(d.perfume.id, "blind"));
      const correct = next.filter(
        (d) => d.bought === (d.perfume.tier === "famous")
      ).length;
      track("game_complete", {
        game: "blind",
        noseScore: Math.round((correct / next.length) * 100),
      });
    } else {
      setIndex(index + 1);
    }
  }

  function playAgain() {
    setDecisions([]);
    setIndex(0);
    setPhase("playing");
    loadFullCatalog().then((catalog) => {
      const famous = catalog.filter((p) => p.tier === "famous");
      setPool(drawRound(famous, catalog));
    });
  }

  const current = pool[index];

  useEffect(() => {
    if (phase !== "playing" || !current) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") decide(false);
      else if (e.key === "ArrowRight") decide(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current]);

  if (phase === "reveal") {
    const correct = decisions.filter((d) => d.bought === (d.perfume.tier === "famous")).length;
    const bought = decisions.filter((d) => d.bought);
    return (
      <div className="flex flex-col gap-7">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
              Your nose scored {Math.round((correct / decisions.length) * 100)}%
            </h1>
            <InfoTooltip label="How the nose score works">
              <p className="font-extrabold text-ink-950 mb-2">What this score means</p>
              <p>
                It tracks how often you matched the crowd: buying well-known crowd-pleasers and
                skipping obscure ones scores higher. It&apos;s not about being &quot;right,&quot;
                just what your nose tends to reach for when there&apos;s no name on the bottle.
              </p>
            </InfoTooltip>
          </div>
          <p className="text-lg font-medium text-ink-400 mt-2">
            You bought {bought.length} of {decisions.length}. Here&apos;s everything you picked.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          {bought.map((d, i) => (
            <ResultCard
              key={d.perfume.id}
              perfume={d.perfume}
              surface="blind"
              offer={offers[d.perfume.id]}
              revealDelay={i * 120 + 30}
            />
          ))}
          {bought.length === 0 && (
            <p className="text-base font-medium text-ink-400">You skipped everything. Bold strategy.</p>
          )}
        </div>
        <Button onClick={playAgain} size="lg" className="self-start">
          Play again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
            Blind Date
          </h1>
          <InfoTooltip label="How to decide">
            <p className="font-extrabold text-ink-950 mb-2">Swipe to decide</p>
            <p>
              On touch devices, swipe the card right to buy it, left to skip it. On desktop, use
              the arrow buttons on either side of the card, or drag it with your mouse.
            </p>
          </InfoTooltip>
        </div>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Just notes and price. No names, no brands. Trust your nose.
        </p>
        <p className="text-sm font-bold text-ink-400 mt-1">
          Swipe right (or click →) to buy. Swipe left (or click ←) to skip.
        </p>
      </div>

      <p className="text-lg font-extrabold text-ink-900">
        Bottle {index + 1} of {pool.length}
      </p>

      {current && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => decide(false)}
            variant="outline"
            size="icon"
            aria-label="Skip"
            className="hidden shrink-0 rounded-full sm:inline-flex"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </Button>

          <div className="min-w-0 flex-1">
            <SwipeCard key={current.id} onSwipeLeft={() => decide(false)} onSwipeRight={() => decide(true)}>
              <div className="rounded-3xl border-2 border-ink-950/8 bg-cream-100 p-6 shadow-card-lg animate-pop-in">
                <div className="flex justify-end">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                    {PRICE_LABELS[current.priceTier] ?? "Mid-Range"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-ink-800 sm:grid-cols-3">
                  {(["top", "heart", "base"] as const).map((layer) => (
                    <div key={layer}>
                      <p className="uppercase text-[11px] font-extrabold tracking-wider text-ink-400 mb-1.5">
                        {layer === "top" ? "Top" : layer === "heart" ? "Heart" : "Base"}
                      </p>
                      {current.notes[layer].length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {current.notes[layer].map((n) => (
                            <span
                              key={n}
                              className="rounded-full border border-ink-950/10 bg-cream-200 px-2 py-0.5 text-xs font-bold text-ink-900"
                            >
                              {n.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium text-ink-400">—</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SwipeCard>
          </div>

          <Button
            onClick={() => decide(true)}
            size="icon"
            aria-label="Buy"
            className="hidden shrink-0 rounded-full sm:inline-flex"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:hidden">
        <Button onClick={() => decide(false)} variant="outline" size="xl">
          Skip
        </Button>
        <Button onClick={() => decide(true)} size="xl">
          Buy
        </Button>
      </div>
    </div>
  );
}
