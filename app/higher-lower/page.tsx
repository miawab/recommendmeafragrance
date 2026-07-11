"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  type HigherLowerDifficulty,
} from "@/lib/higherLower";
import { getStreak, recordBestStreak } from "@/lib/shelf";
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

const PRICE_LABELS = ["", "Budget", "Mid-Range", "Designer", "Niche", "Ultra"];

function label(p: PerfumeEntry, attribute: HigherLowerAttribute): string {
  const v = attributeValue(p, attribute);
  if (attribute === "year") return v == null ? "unknown" : String(v);
  return v == null ? "unknown" : PRICE_LABELS[v] ?? String(v);
}

/** Extra info shown in the expand panel: whichever of year/price ISN'T this
 * round's question, plus gender and concentration. Never includes the
 * attribute being guessed, so expanding never spoils the round. */
function extraInfo(p: PerfumeEntry, attribute: HigherLowerAttribute) {
  const rows: { label: string; value: string }[] = [];
  if (attribute !== "year") {
    rows.push({ label: "Year", value: p.year == null ? "Unknown" : String(p.year) });
  }
  if (attribute !== "price") {
    rows.push({ label: "Price tier", value: PRICE_LABELS[p.priceTier] ?? "Mid-Range" });
  }
  rows.push({ label: "Gender", value: p.gender });
  rows.push({ label: "Concentration", value: p.concentration });
  return rows;
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
  const [expanded, setExpanded] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const [difficulty, setDifficulty] = useState<HigherLowerDifficulty>("easy");
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

  function startRound(idx: number, level: HigherLowerDifficulty = difficulty) {
    const attribute: HigherLowerAttribute = idx % 2 === 0 ? "year" : "price";
    const [a, b] = drawPair(famous, full, attribute, level);
    setRound({ a, b, attribute });
    setRoundIndex(idx);
    setExpanded({ a: false, b: false });
  }

  function changeDifficulty(level: HigherLowerDifficulty) {
    if (level === difficulty) return;
    setDifficulty(level);
    setOver(false);
    setStreak(0);
    setMilestoneBottle(null);
    startRound(0, level);
    track("game_start", { game: GAME, difficulty: level });
  }

  function toggleExpanded(side: "a" | "b") {
    setExpanded((prev) => ({ ...prev, [side]: !prev[side] }));
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
        // Milestone reveal only, no shelf add: this game only lands on the
        // shelf via a buy-link click, never just for playing well.
        const bottle = correctSide === "a" ? round.a : round.b;
        setMilestoneBottle(bottle);
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

      <div className="flex flex-wrap items-center gap-5 text-base font-bold text-ink-900">
        <span>Streak: {streak} 🔥</span>
        <span>Best: {best}</span>
        <InfoTooltip label="How this game works">
          <p className="font-extrabold text-ink-950 mb-2">How to play</p>
          <p>
            Each round asks which of two fragrances released first, or which one costs more.
            Guess right to keep your streak going, one wrong answer ends the run. Every 5 in a
            row unlocks a bonus reveal. Easy mode leans on famous bottles with an obvious gap,
            hard mode pulls from the deep catalog and can come down to a single year or tier.
          </p>
        </InfoTooltip>
        <div className="ml-auto flex gap-1.5 rounded-full border-2 border-ink-950/10 bg-cream-100 p-1">
          {(["easy", "hard"] as HigherLowerDifficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => changeDifficulty(level)}
              className={`tap-target rounded-full px-4 py-1.5 text-sm font-extrabold capitalize transition-all ${
                difficulty === level
                  ? "bg-amber-400 text-ink-950 shadow-card"
                  : "text-ink-400 hover:text-ink-950"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
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
                <div
                  key={side}
                  role="button"
                  tabIndex={revealed ? -1 : 0}
                  aria-disabled={revealed}
                  onClick={() => handleSelect(side)}
                  onKeyDown={(e) => {
                    if (!revealed && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleSelect(side);
                    }
                  }}
                  className={`tap-target rounded-3xl border-[3px] ${tone} bg-cream-100 p-6 text-left shadow-card transition-all ${
                    revealed ? "" : "active:scale-95 cursor-pointer"
                  }`}
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

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(side);
                    }}
                    className="tap-target mt-3 flex items-center gap-1 text-sm font-bold text-ink-400 hover:text-ink-950 transition-colors"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expanded[side] ? "rotate-180" : ""}`}
                      strokeWidth={2.5}
                    />
                    {expanded[side] ? "Less info" : "More info"}
                  </button>

                  {expanded[side] && (
                    <div className="mt-3 flex flex-col gap-1.5 animate-pop-in">
                      {extraInfo(p, round.attribute).map((row) => (
                        <p key={row.label} className="text-sm font-medium text-ink-800 capitalize">
                          <span className="font-extrabold text-ink-400 uppercase text-xs tracking-wider not-italic">
                            {row.label}:
                          </span>{" "}
                          {row.value}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
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
