"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@/components/Autocomplete";
import Celebration from "@/components/Celebration";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { loadFullCatalog } from "@/lib/catalog";
import { addToShelf, getHistory, recordDailyPlay, setHistory } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { todayUTC } from "@/lib/seededRandom";
import { useOffers } from "@/lib/useOffers";

const GAME = "detective";
const START_SCORE = 1000;
const REVEAL_COST = 100;
const WRONG_GUESS_COST = 50;

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
  const offers = useOffers();

  useEffect(() => {
    loadFullCatalog().then(setCatalog);
    const saved = getHistory(GAME)[date] as DayState | undefined;
    if (saved) setState(saved);
    else track("game_start", { game: GAME, date });
  }, [date]);

  useEffect(() => {
    if (state.completed && !state.won && !state.answerId) {
      fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, gameName: GAME, action: "reveal" }),
      })
        .then((r) => r.json())
        .then((data: { answer: PerfumeEntry }) => {
          const next = { ...state, answerId: data.answer.id };
          setState(next);
          setHistory(GAME, date, next);
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
      body: JSON.stringify({ date, gameName: GAME, action: "peek", revealCount: requestedCount }),
    });
    const data: { notes: string[] } = await res.json();
    const fullyRevealed = data.notes.length <= state.revealedNotes.length;
    const next: DayState = {
      ...state,
      revealCount: requestedCount,
      revealedNotes: data.notes,
      score: Math.max(0, state.score - (fullyRevealed ? 0 : REVEAL_COST)),
      fullyRevealed,
    };
    setState(next);
    setHistory(GAME, date, next);
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
      setHistory(GAME, date, next);
      recordDailyPlay(GAME, date, true);
      addToShelf(perfume.id, GAME);
      track("game_complete", { game: GAME, won: true, score: state.score });
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
    setHistory(GAME, date, next);
    if (outOfPoints) {
      recordDailyPlay(GAME, date, false);
      track("game_complete", { game: GAME, won: false, score });
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
          Notes reveal from the base up. Guess before you run out of points.
        </p>
      </div>

      <div className="flex items-center gap-3 text-xl font-extrabold text-ink-900">
        <span>Score: {state.score}</span>
        <InfoTooltip label="How scoring works">
          <p className="font-extrabold text-ink-950 mb-2">Scoring</p>
          <ul className="flex flex-col gap-1.5">
            <li>You start at <strong>{START_SCORE}</strong> points.</li>
            <li>Revealing a note costs <strong>{REVEAL_COST}</strong> points.</li>
            <li>A wrong guess costs <strong>{WRONG_GUESS_COST}</strong> points.</li>
            <li>Notes reveal <strong>base first</strong> (hardest to place), then heart, then top.</li>
          </ul>
        </InfoTooltip>
      </div>

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
            disabled={state.fullyRevealed}
            variant="outline"
            size="lg"
            className="self-start"
          >
            Reveal next note (-{REVEAL_COST})
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
