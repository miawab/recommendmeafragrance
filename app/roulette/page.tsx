"use client";

import { useEffect, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { track } from "@/lib/analytics";
import { loadFullCatalog } from "@/lib/catalog";
import { filterCandidates, pickWeighted, type RouletteDials } from "@/lib/roulette";
import { addToShelf } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { useOffers } from "@/lib/useOffers";

const SEASONS = ["any", "spring", "summer", "fall", "winter", "all-season"];
const OCCASIONS = ["any", "office", "date", "night-out", "gym", "everyday"];
const PRICE_LABELS = ["", "Budget", "Mid-Range", "Designer", "Niche", "Ultra"];

export default function RoulettePage() {
  const [catalog, setCatalog] = useState<PerfumeEntry[]>([]);
  const [dials, setDials] = useState<RouletteDials>({
    season: "any",
    occasion: "any",
    minPrice: 1,
    maxPrice: 5,
    chaos: 20,
  });
  const [pick, setPick] = useState<PerfumeEntry | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [rerolls, setRerolls] = useState(0);
  const offers = useOffers();

  useEffect(() => {
    loadFullCatalog().then(setCatalog);
    track("game_start", { game: "roulette" });
  }, []);

  function spin() {
    const pool = filterCandidates(catalog, dials);
    const chosen = pickWeighted(pool, dials.chaos);
    setPick(chosen ?? null);
    setSpinKey((k) => k + 1);
    if (chosen) {
      addToShelf(chosen.id, "roulette");
      track("game_complete", { game: "roulette", perfumeId: chosen.id, rerolls });
    }
    setRerolls((r) => r + 1);
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
          Scent Roulette
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Set your mood, pull the lever, see what comes up.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-extrabold uppercase tracking-widest text-ink-400">Season</span>
          <Select
            value={dials.season}
            onValueChange={(v) => setDials((d) => ({ ...d, season: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEASONS.map((s) => (
                <SelectItem key={s} value={s} className="text-lg font-semibold">
                  {s === "any" ? "Any season" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-extrabold uppercase tracking-widest text-ink-400">Occasion</span>
          <Select
            value={dials.occasion}
            onValueChange={(v) => setDials((d) => ({ ...d, occasion: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OCCASIONS.map((o) => (
                <SelectItem key={o} value={o} className="text-lg font-semibold">
                  {o === "any" ? "Any occasion" : o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          <span className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-widest text-ink-400">
            Budget: {PRICE_LABELS[dials.minPrice]} to {PRICE_LABELS[dials.maxPrice]}
            <InfoTooltip label="What the price tiers mean">
              <p className="font-extrabold text-ink-950 mb-2">Price tiers</p>
              <p>
                Budget (under $50), Mid-Range ($50&ndash;100), Designer ($100&ndash;170), Niche
                ($170&ndash;300), Ultra (over $300). This is the perceived class of the bottle,
                not a live price, real prices show up on the result card when we have one.
              </p>
            </InfoTooltip>
          </span>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[dials.minPrice, dials.maxPrice]}
            onValueChange={([minPrice, maxPrice]) => setDials((d) => ({ ...d, minPrice, maxPrice }))}
          />
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          <span className="flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-widest text-ink-400">
            Surprise me: {dials.chaos === 0 ? "famous only" : `${dials.chaos}% deep cuts`}
            <InfoTooltip label="What surprise me does">
              <p className="font-extrabold text-ink-950 mb-2">Surprise me</p>
              <p>
                At 0%, you&apos;ll only land on well-known fragrances. Turn it up and we start
                mixing in deeper cuts nobody&apos;s heard of, at 100% it&apos;s almost entirely
                obscure picks.
              </p>
            </InfoTooltip>
          </span>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[dials.chaos]}
            onValueChange={([chaos]) => setDials((d) => ({ ...d, chaos }))}
          />
        </div>
      </div>

      <Button onClick={spin} disabled={catalog.length === 0} size="xl" className="self-start">
        {pick ? "Reroll" : "Spin"}
      </Button>

      {pick && <ResultCard key={spinKey} perfume={pick} surface="roulette" offer={offers[pick.id]} />}
      {!pick && rerolls > 0 && (
        <p className="text-base font-medium text-ink-400">
          Nothing matched those dials, try widening the budget or season.
        </p>
      )}
    </div>
  );
}
