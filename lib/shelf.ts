"use client";

import type { Surface } from "./types";

const SHELF_KEY = "rmf:shelf";
const STREAK_KEY = "rmf:streak";
const HISTORY_KEY = "rmf:history";
const USER_ID_KEY = "rmf:uid";

export interface ShelfItem {
  perfumeId: string;
  source: Surface;
  discoveredAt: string; // ISO date
}

export interface StreakState {
  current: number;
  best: number;
  lastPlayedDate: string | null;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getShelf(): ShelfItem[] {
  return readJson<ShelfItem[]>(SHELF_KEY, []);
}

export function addToShelf(perfumeId: string, source: Surface): void {
  const shelf = getShelf();
  if (shelf.some((s) => s.perfumeId === perfumeId)) return;
  shelf.push({ perfumeId, source, discoveredAt: new Date().toISOString() });
  writeJson(SHELF_KEY, shelf);
}

export function isOnShelf(perfumeId: string): boolean {
  return getShelf().some((s) => s.perfumeId === perfumeId);
}

export function getStreak(gameName: string): StreakState {
  return readJson<StreakState>(`${STREAK_KEY}:${gameName}`, {
    current: 0,
    best: 0,
    lastPlayedDate: null,
  });
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

/** Call once per day when a daily game is completed (win or loss both count as "played"). */
export function recordDailyPlay(gameName: string, dateISO: string, won: boolean): StreakState {
  const state = getStreak(gameName);
  if (state.lastPlayedDate === dateISO) return state; // already recorded today

  let current = state.current;
  if (!won) {
    current = 0;
  } else if (state.lastPlayedDate && daysBetween(state.lastPlayedDate, dateISO) === 1) {
    current += 1;
  } else {
    current = 1;
  }
  const next: StreakState = {
    current,
    best: Math.max(state.best, current),
    lastPlayedDate: dateISO,
  };
  writeJson(`${STREAK_KEY}:${gameName}`, next);
  return next;
}

export function recordBestStreak(gameName: string, streakValue: number): void {
  const state = getStreak(gameName);
  if (streakValue > state.best) {
    writeJson(`${STREAK_KEY}:${gameName}`, { ...state, best: streakValue });
  }
}

export function getHistory(gameName: string): Record<string, unknown> {
  return readJson(`${HISTORY_KEY}:${gameName}`, {});
}

export function setHistory(gameName: string, dateISO: string, value: unknown): void {
  const history = getHistory(gameName);
  history[dateISO] = value;
  writeJson(`${HISTORY_KEY}:${gameName}`, history);
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  let uid = window.localStorage.getItem(USER_ID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    window.localStorage.setItem(USER_ID_KEY, uid);
    document.cookie = `rmf_uid=${uid}; path=/; max-age=31536000; SameSite=Lax`;
  }
  return uid;
}
