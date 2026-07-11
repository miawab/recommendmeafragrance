"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@/components/Autocomplete";
import Celebration from "@/components/Celebration";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import ScentleRow from "@/components/ScentleRow";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { loadFullCatalog } from "@/lib/catalog";
import type { DailyDifficulty } from "@/lib/dailyAnswer";
import type { ScentleFeedback } from "@/lib/scentle";
import { buildShareGrid } from "@/lib/scentle";
import {
  addToShelf,
  getHistory,
  getStreak,
  recordDailyPlay,
  setHistory,
  type StreakState,
} from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { todayUTC } from "@/lib/seededRandom";
import { useOffers } from "@/lib/useOffers";

const MAX_GUESSES = 6;
const GAME = "scentle";
const DIFFICULTY_KEY = "rmf:scentle:difficulty";

interface DayState {
  guesses: string[];
  feedbacks: ScentleFeedback[];
  completed: boolean;
  won: boolean;
  answerId?: string;
}

const EMPTY_STATE: DayState = { guesses: [], feedbacks: [], completed: false, won: false };
const EMPTY_STREAK: StreakState = { current: 0, best: 0, lastPlayedDate: null };

export default function ScentlePage() {
  const date = useMemo(() => todayUTC(), []);
  const [catalog, setCatalog] = useState<PerfumeEntry[]>([]);
  const [state, setState] = useState<DayState>(EMPTY_STATE);
  const [streak, setStreak] = useState<StreakState>(EMPTY_STREAK);
  const [copyLabel, setCopyLabel] = useState("Copy share card");
  const [difficulty, setDifficulty] = useState<DailyDifficulty>("easy");
  const offers = useOffers();
  const historyKey = `${date}:${difficulty}`;

  useEffect(() => {
    loadFullCatalog().then(setCatalog);
    setStreak(getStreak(GAME));
    const savedDifficulty = window.localStorage.getItem(DIFFICULTY_KEY);
    if (savedDifficulty === "easy" || savedDifficulty === "hard") setDifficulty(savedDifficulty);
  }, []);

  // Today's puzzle for the current difficulty: easy and hard are different
  // fragrances, each with its own saved state.
  useEffect(() => {
    const saved = getHistory(GAME)[historyKey] as DayState | undefined;
    if (saved) {
      setState(saved);
    } else {
      setState(EMPTY_STATE);
      track("game_start", { game: GAME, date, difficulty });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, difficulty, historyKey]);

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

  const guessedIds = new Set(state.guesses);
  const answer = state.answerId ? catalog.find((p) => p.id === state.answerId) : undefined;

  function changeDifficulty(next: DailyDifficulty) {
    if (next === difficulty) return;
    setDifficulty(next);
    window.localStorage.setItem(DIFFICULTY_KEY, next);
  }

  async function handleGuess(perfume: PerfumeEntry) {
    if (state.completed) return;
    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, gameName: GAME, action: "guess", guessId: perfume.id, difficulty }),
    });
    const data: { feedback: ScentleFeedback; answer?: PerfumeEntry } = await res.json();

    const guesses = [...state.guesses, perfume.id];
    const feedbacks = [...state.feedbacks, data.feedback];
    const completed = data.feedback.correct || guesses.length >= MAX_GUESSES;
    const won = data.feedback.correct;

    const next: DayState = {
      guesses,
      feedbacks,
      completed,
      won,
      answerId: won ? perfume.id : undefined,
    };
    setState(next);
    setHistory(GAME, historyKey, next);

    if (completed) {
      setStreak(recordDailyPlay(GAME, date, won));
      track("game_complete", { game: GAME, won, guessCount: guesses.length, difficulty });
      if (won) addToShelf(perfume.id, GAME);
    }
  }

  function handleShare() {
    const text = `Scentle ${date}\n${buildShareGrid(state.feedbacks)}\nStreak: ${streak.current} 🔥\nPlay at recommendmeafragrance`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy share card"), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-widest text-amber-600">daily puzzle</p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950 mt-1">Scentle</h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Guess today&apos;s fragrance in {MAX_GUESSES} tries. Every guess tells you a little more.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-base font-bold text-ink-900">
        <span>
          {state.guesses.length} of {MAX_GUESSES} guesses used
        </span>
        <span>Streak: {streak.current} 🔥 (best {streak.best})</span>
        <InfoTooltip label="How to read the feedback grid">
          <p className="font-extrabold text-ink-950 mb-2">How to read your guess</p>
          <ul className="flex flex-col gap-1.5">
            <li>
              <strong>Brand</strong>: ✓ exact match, ~ same brand family (e.g. both niche houses), ✗ unrelated.
            </li>
            <li>
              <strong>Year</strong>: ↑ means today&apos;s answer came out later than your guess, ↓ means earlier.
            </li>
            <li>
              <strong>Gender / Conc.</strong>: ✓ or ✗, exact match only.
            </li>
            <li>
              <strong>Price</strong>: ↑ the answer is a pricier tier than your guess, ↓ it&apos;s cheaper.
            </li>
            <li>
              <strong>Notes</strong>: how many top/heart/base notes your guess shares with the answer.
            </li>
            <li>
              <strong>Easy</strong> picks a famous, well-known bottle. <strong>Hard</strong> digs into
              the deeper catalog.
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

      {!state.completed && (
        <Autocomplete catalog={catalog} onSelect={handleGuess} excludeIds={guessedIds} />
      )}

      <div className="flex flex-col gap-4">
        {state.guesses.map((id, i) => {
          const p = catalog.find((c) => c.id === id);
          if (!p) return null;
          return <ScentleRow key={id + i} guess={p} feedback={state.feedbacks[i]} />;
        })}
      </div>

      {state.completed && (
        <div className="flex flex-col gap-5">
          <div className="relative">
            <Celebration show={state.won} />
            <p className="text-xl font-extrabold text-ink-950">
              {state.won ? "Nice nose. You found it." : "Out of guesses, here's today's answer."}
            </p>
          </div>
          {answer && (
            <ResultCard perfume={answer} surface="scentle" offer={offers[answer.id]} />
          )}
          <Button onClick={handleShare} variant="outline" size="lg" className="self-start">
            {copyLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
