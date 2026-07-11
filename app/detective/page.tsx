"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@/components/Autocomplete";
import Celebration from "@/components/Celebration";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { loadFullCatalog } from "@/lib/catalog";
import type { DailyDifficulty } from "@/lib/dailyAnswer";
import { addToShelf, getHistory, recordDailyPlay, setHistory } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { todayUTC } from "@/lib/seededRandom";
import { revealPctFor } from "@/lib/detectiveMask";
import { useOffers } from "@/lib/useOffers";

const GAME = "detective";
const START_SCORE = 1000;
// Half the starting score is set aside for note reveals, split evenly across
// however many notes the answer actually has, so a 6-note perfume and a
// 16-note perfume each cost the same total share to fully reveal.
const REVEAL_BUDGET_SHARE = 0.5;
const FALLBACK_REVEAL_COST = 50;
const WRONG_GUESS_COST = 50;
const MODE_KEY = "rmf:detective:mode";
const DIFFICULTY_KEY = "rmf:detective:difficulty";
const PRICE_LABELS = ["", "Budget", "Mid-Range", "Designer", "Niche", "Ultra"];
const BRAND_GROUP_LABELS: Record<string, string> = {
  designer: "Designer house",
  niche: "Niche house",
  "arab-house": "Arab house",
  "mass-market": "Mass-market brand",
};

type InfoMode = "basic" | "full";

interface AnswerMeta {
  year: number | null;
  gender: string;
  priceTier: number;
  concentration: string;
  brand: string;
  brandGroup: string;
  nameMask: string;
  totalNotes: number;
}

function revealCostFor(totalNotes: number | undefined): number {
  if (!totalNotes || totalNotes <= 0) return FALLBACK_REVEAL_COST;
  return Math.max(1, Math.round((START_SCORE * REVEAL_BUDGET_SHARE) / totalNotes));
}

interface DayState {
  revealCount: number;
  revealedNotes: string[];
  wrongGuesses: string[];
  score: number;
  completed: boolean;
  won: boolean;
  fullyRevealed: boolean;
  answerId?: string;
}

const EMPTY_STATE: DayState = {
  revealCount: 0,
  revealedNotes: [],
  wrongGuesses: [],
  score: START_SCORE,
  completed: false,
  won: false,
  fullyRevealed: false,
};

export default function NoteDetectivePage() {
  const date = useMemo(() => todayUTC(), []);
  const [catalog, setCatalog] = useState<PerfumeEntry[]>([]);
  const [state, setState] = useState<DayState>(EMPTY_STATE);
  const [mode, setMode] = useState<InfoMode>("basic");
  const [difficulty, setDifficulty] = useState<DailyDifficulty>("easy");
  const [meta, setMeta] = useState<AnswerMeta | null>(null);
  const [nameMask, setNameMask] = useState<string | null>(null);
  const offers = useOffers();
  const historyKey = `${date}:${difficulty}`;

  // One-time setup: load the catalog and any saved preferences.
  useEffect(() => {
    loadFullCatalog().then(setCatalog);
    const savedMode = window.localStorage.getItem(MODE_KEY);
    if (savedMode === "basic" || savedMode === "full") setMode(savedMode);
    const savedDifficulty = window.localStorage.getItem(DIFFICULTY_KEY);
    if (savedDifficulty === "easy" || savedDifficulty === "hard") setDifficulty(savedDifficulty);
  }, []);

  // Today's puzzle for the current difficulty: easy and hard are different
  // fragrances, so each gets its own saved state and its own meta/mask fetch.
  useEffect(() => {
    const saved = getHistory(GAME)[historyKey] as DayState | undefined;
    if (saved) {
      setState(saved);
    } else {
      setState(EMPTY_STATE);
      track("game_start", { game: GAME, date, difficulty });
    }
    setMeta(null);
    setNameMask(null);

    fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, gameName: GAME, action: "meta", difficulty }),
    })
      .then((r) => r.json())
      .then((data: AnswerMeta) => {
        setMeta(data);
        setNameMask((m) => m ?? data.nameMask);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, difficulty, historyKey]);

  useEffect(() => {
    if (state.revealCount === 0) return;
    fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        gameName: GAME,
        action: "mask",
        revealCount: state.revealCount,
        difficulty,
      }),
    })
      .then((r) => r.json())
      .then((data: { nameMask: string }) => setNameMask(data.nameMask));
  }, [date, difficulty, state.revealCount]);

  function changeMode(next: InfoMode) {
    setMode(next);
    window.localStorage.setItem(MODE_KEY, next);
  }

  function changeDifficulty(next: DailyDifficulty) {
    if (next === difficulty) return;
    setDifficulty(next);
    window.localStorage.setItem(DIFFICULTY_KEY, next);
  }

  useEffect(() => {
    if (state.completed && !state.won && !state.answerId) {
      fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, gameName: GAME, action: "reveal", difficulty }),
      })
        .then((r) => r.json())
        .then((data: { answer: PerfumeEntry }) => {
          const next = { ...state, answerId: data.answer.id };
          setState(next);
          setHistory(GAME, historyKey, next);
          addToShelf(data.answer.id, GAME);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.completed, state.won, state.answerId]);

  const answer = state.answerId ? catalog.find((p) => p.id === state.answerId) : undefined;

  async function revealNext() {
    if (state.completed || state.fullyRevealed) return;
    const requestedCount = state.revealCount + 1;
    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        gameName: GAME,
        action: "peek",
        revealCount: requestedCount,
        difficulty,
      }),
    });
    const data: { notes: string[] } = await res.json();
    const fullyRevealed = data.notes.length <= state.revealedNotes.length;
    const next: DayState = {
      ...state,
      revealCount: requestedCount,
      revealedNotes: data.notes,
      score: Math.max(0, state.score - (fullyRevealed ? 0 : revealCostFor(meta?.totalNotes))),
      fullyRevealed,
    };
    setState(next);
    setHistory(GAME, historyKey, next);
  }

  async function handleGuess(perfume: PerfumeEntry) {
    if (state.completed) return;
    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        gameName: GAME,
        action: "guess",
        guessId: perfume.id,
        revealCount: state.revealCount,
        difficulty,
      }),
    });
    const data: { correct: boolean; notes: string[]; answer?: PerfumeEntry } = await res.json();

    if (data.correct) {
      const next: DayState = {
        ...state,
        completed: true,
        won: true,
        answerId: perfume.id,
      };
      setState(next);
      setHistory(GAME, historyKey, next);
      recordDailyPlay(GAME, date, true);
      addToShelf(perfume.id, GAME);
      track("game_complete", { game: GAME, won: true, score: state.score, difficulty });
      return;
    }

    const score = Math.max(0, state.score - WRONG_GUESS_COST);
    const outOfPoints = score <= 0;
    const next: DayState = {
      ...state,
      score,
      wrongGuesses: [...state.wrongGuesses, perfume.id],
      completed: outOfPoints,
      won: false,
    };
    setState(next);
    setHistory(GAME, historyKey, next);
    if (outOfPoints) {
      recordDailyPlay(GAME, date, false);
      track("game_complete", { game: GAME, won: false, score, difficulty });
    }
  }

  const excludeIds = new Set(state.wrongGuesses);

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-widest text-amber-600">daily puzzle</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950 mt-1">
          Note Detective
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Notes reveal top, heart, then base, cycling. Guess before you run out of points.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xl font-extrabold text-ink-900">
        <span>Score: {state.score}</span>
        <InfoTooltip label="How scoring works">
          <p className="font-extrabold text-ink-950 mb-2">Scoring</p>
          <ul className="flex flex-col gap-1.5">
            <li>You start at <strong>{START_SCORE}</strong> points.</li>
            <li>
              Revealing a note costs <strong>{revealCostFor(meta?.totalNotes)}</strong> points
              this puzzle, half your starting score split evenly across every note this perfume
              has, so it&apos;s fair whether it has 6 notes or 16.
            </li>
            <li>A wrong guess costs <strong>{WRONG_GUESS_COST}</strong> points.</li>
            <li>
              Notes reveal one top, one heart, one base at a time, cycling. A layer that runs
              out is skipped, the rest keep cycling.
            </li>
            <li>
              The name uncovers about <strong>7%</strong> more letters each time you reveal a
              note, not tied to your score. At 0 points the answer is revealed.
            </li>
            <li>
              <strong>Easy</strong> picks a famous, well-known bottle. <strong>Hard</strong>{" "}
              digs into the deeper catalog.
            </li>
          </ul>
        </InfoTooltip>
        <div className="ml-auto flex gap-1.5 rounded-full border-2 border-ink-950/10 bg-cream-100 p-1">
          {(["easy", "hard"] as DailyDifficulty[]).map((level) => (
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

      {nameMask && (
        <div className="rounded-3xl border-2 border-ink-950/8 bg-cream-100 p-5 shadow-card">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink-400">
            The name ({Math.round(revealPctFor(state.revealCount) * 100)}% revealed)
          </p>
          <p className="font-display text-2xl font-extrabold tracking-[0.25em] text-ink-950 sm:text-3xl">
            {nameMask}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-full bg-cream-200 p-1">
          <button
            type="button"
            onClick={() => changeMode("basic")}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors ${
              mode === "basic" ? "bg-ink-950 text-cream-100" : "text-ink-900"
            }`}
          >
            Basic
          </button>
          <button
            type="button"
            onClick={() => changeMode("full")}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors ${
              mode === "full" ? "bg-ink-950 text-cream-100" : "text-ink-900"
            }`}
          >
            Full Info
          </button>
        </div>
        <InfoTooltip label="What Basic and Full Info modes show">
          <p className="font-extrabold text-ink-950 mb-2">Info modes</p>
          <p>
            <strong>Basic</strong> shows the release year and what kind of house makes it.{" "}
            <strong>Full Info</strong> also names the exact brand plus gender, price tier, and
            concentration, much easier.
          </p>
        </InfoTooltip>
      </div>

      {meta && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border-2 border-ink-950/10 bg-cream-100 px-3 py-1.5 text-sm font-bold text-ink-900">
            Year: {meta.year ?? "Unknown"}
          </span>
          <span className="rounded-full border-2 border-ink-950/10 bg-cream-100 px-3 py-1.5 text-sm font-bold text-ink-900">
            {BRAND_GROUP_LABELS[meta.brandGroup] ?? "Fragrance house"}
          </span>
          {mode === "full" && (
            <>
              <span className="rounded-full border-2 border-amber-300 bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-ink-950">
                By {meta.brand}
              </span>
              <span className="rounded-full border-2 border-ink-950/10 bg-cream-100 px-3 py-1.5 text-sm font-bold text-ink-900 capitalize">
                {meta.gender}
              </span>
              <span className="rounded-full border-2 border-ink-950/10 bg-cream-100 px-3 py-1.5 text-sm font-bold text-ink-900">
                {PRICE_LABELS[meta.priceTier] ?? "Mid-Range"}
              </span>
              <span className="rounded-full border-2 border-ink-950/10 bg-cream-100 px-3 py-1.5 text-sm font-bold text-ink-900 capitalize">
                {meta.concentration}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 min-h-[3rem]">
        {state.revealedNotes.length === 0 && (
          <p className="text-base font-medium text-ink-400">No notes revealed yet.</p>
        )}
        {state.revealedNotes.map((n, i) => (
          <span
            key={n + i}
            className="animate-pop-in rounded-full border-2 border-amber-300 bg-amber-100 px-4 py-2 text-base font-bold text-ink-950"
          >
            {n.replace(/-/g, " ")}
          </span>
        ))}
      </div>

      {!state.completed && (
        <div className="flex flex-col gap-4">
          <Button
            onClick={revealNext}
            disabled={state.fullyRevealed || !meta}
            variant="outline"
            size="lg"
            className="self-start"
          >
            Reveal next note (-{revealCostFor(meta?.totalNotes)})
          </Button>
          <Autocomplete catalog={catalog} onSelect={handleGuess} excludeIds={excludeIds} />
        </div>
      )}

      {state.completed && (
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Celebration show={state.won} />
            <p className="text-xl font-extrabold text-ink-950">
              {state.won ? `Solved it for ${state.score} points.` : "Out of points, here's the answer."}
            </p>
          </div>
          {answer && <ResultCard perfume={answer} surface="detective" offer={offers[answer.id]} />}
        </div>
      )}
    </div>
  );
}
