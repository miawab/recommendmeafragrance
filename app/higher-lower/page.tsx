"use client";

import { useEffect, useState } from "react";
import Celebration from "@/components/Celebration";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { loadFullCatalog } from "@/lib/catalog";
import {
  attributeValue,
  drawPair,
  higherSide,
  type HigherLowerAttribute,
} from "@/lib/higherLower";
import { addToShelf, getStreak, recordBestStreak } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { useOffers } from "@/lib/useOffers";

const GAME = "hol";

interface Round {
  a: PerfumeEntry;
  b: PerfumeEntry;
  attribute: HigherLowerAttribute;
  selected?: "a" | "b";
  correct?: boolean;
}

function correctSideFor(a: PerfumeEntry, b: PerfumeEntry, attribute: HigherLowerAttribute) {
  const hs = higherSide(a, b, attribute);
  return attribute === "year" ? (hs === "a" ? "b" : "a") : hs;
}

function label(p: PerfumeEntry, attribute: HigherLowerAttribute): string {
  const v = attributeValue(p, attribute);
  if (attribute === "year") return v == null ? "unknown" : String(v);
  const names = ["", "Budget", "Mid", "Designer", "Niche", "Ultra"];
  return v == null ? "unknown" : names[v] ?? String(v);
}

export default function HigherLowerPage() {
  const [famous, setFamous] = useState<PerfumeEntry[]>([]);
  const [full, setFull] = useState<PerfumeEntry[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [milestoneBottle, setMilestoneBottle] = useState<PerfumeEntry | null>(null);
  const offers = useOffers();

  useEffect(() => {
    loadFullCatalog().then((catalog) => {
      setFull(catalog);
      setFamous(catalog.filter((p) => p.tier === "famous"));
    });
    setBest(getStreak(GAME).best);
    track("game_start", { game: GAME });
  }, []);

  useEffect(() => {
    if (famous.length > 0 && full.length > 0 && !round && !over) {
      startRound(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [famous, full]);

  function startRound(idx: number) {
    const attribute: HigherLowerAttribute = idx % 2 === 0 ? "year" : "price";
    const [a, b] = drawPair(famous, full, attribute);
    setRound({ a, b, attribute });
    setRoundIndex(idx);
  }

  function handleSelect(side: "a" | "b") {
    if (!round || round.selected) return;
    const correctSide = correctSideFor(round.a, round.b, round.attribute);
    const correct = side === correctSide;
    setRound({ ...round, selected: side, correct });

    if (correct) {
      const next = streak + 1;
      setStreak(next);
      recordBestStreak(GAME, next);
      setBest((b) => Math.max(b, next));
      if (next % 5 === 0) {
        const bottle = correctSide === "a" ? round.a : round.b;
        setMilestoneBottle(bottle);
        addToShelf(bottle.id, GAME);
      }
    } else {
      setOver(true);
      track("game_complete", { game: GAME, streak });
    }
  }

  function nextRound() {
    setMilestoneBottle(null);
    startRound(roundIndex + 1);
  }

  function playAgain() {
    setOver(false);
    setStreak(0);
    setMilestoneBottle(null);
    startRound(0);
  }

  const question = round?.attribute === "year" ? "Which released first?" : "Which is pricier?";

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
          Higher or Lower
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Guess right to keep your streak alive. One miss and it&apos;s over.
        </p>
      </div>

      <div className="flex items-center gap-5 text-base font-bold text-ink-900">
        <span>Streak: {streak} 🔥</span>
        <span>Best: {best}</span>
        <InfoTooltip label="How this game works">
          <p className="font-extrabold text-ink-950 mb-2">How to play</p>
          <p>
            Each round asks which of two fragrances released first, or which one costs more.
            Guess right to keep your streak going, one wrong answer ends the run. Every 5 in a
            row unlocks a bonus reveal.
          </p>
        </InfoTooltip>
      </div>

      {round && !over && (
        <div className="flex flex-col gap-5">
          <p className="text-center font-display text-2xl font-extrabold text-ink-950">{question}</p>
          <div className="grid grid-cols-2 gap-4">
            {(["a", "b"] as const).map((side) => {
              const p = side === "a" ? round.a : round.b;
              const revealed = !!round.selected;
              const isCorrectSide = correctSideFor(round.a, round.b, round.attribute) === side;
              const tone = !revealed
                ? "border-ink-950/10"
                : isCorrectSide
                  ? "border-hit"
                  : round.selected === side
                    ? "border-ink-400"
                    : "border-ink-950/10";
              return (
                <button
                  key={side}
                  onClick={() => handleSelect(side)}
                  disabled={revealed}
                  className={`tap-target rounded-3xl border-[3px] ${tone} bg-cream-100 p-6 text-left shadow-card active:scale-95 transition-all`}
                >
                  <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">
                    {p.brand}
                  </p>
                  <p className="font-display text-xl font-extrabold text-ink-950 mt-0.5">{p.name}</p>
                  {revealed && (
                    <p className="mt-3 text-lg font-extrabold text-amber-600">
                      {label(p, round.attribute)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {round.selected && (
            <div className="flex flex-col items-center gap-4">
              <p className={`text-xl font-extrabold ${round.correct ? "text-hit" : "text-ink-400"}`}>
                {round.correct ? "Right!" : "Not quite."}
              </p>
              {round.correct && (
                <Button onClick={nextRound} size="lg">
                  Next round
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {milestoneBottle && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Celebration show={!!milestoneBottle} />
            <p className="text-center text-xl font-extrabold text-amber-600">
              Milestone! {streak} in a row 🔥
            </p>
          </div>
          <ResultCard
            perfume={milestoneBottle}
            surface="hol"
            offer={offers[milestoneBottle.id]}
          />
        </div>
      )}

      {over && (
        <div className="flex flex-col gap-5">
          <p className="text-xl font-extrabold text-ink-950">Run over. You hit a streak of {streak}.</p>
          <Button onClick={playAgain} size="lg" className="self-start">
            Play again
          </Button>
        </div>
      )}
    </div>
  );
}
