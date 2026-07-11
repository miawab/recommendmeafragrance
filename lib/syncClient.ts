"use client";

/**
 * Cross-device progress sync for logged-in users. localStorage stays the
 * source of truth for instant reads; this module mirrors it to /api/sync
 * (debounced) and merges the server copy back in after login. Reads the
 * rmf:* localStorage keys directly rather than importing lib/shelf.ts, so
 * shelf.ts can depend on schedulePush() without an import cycle.
 */

interface ShelfItemLike {
  perfumeId: string;
  discoveredAt?: string;
}

interface StreakLike {
  current: number;
  best: number;
  lastPlayedDate: string | null;
}

interface ProgressBlob {
  shelf: ShelfItemLike[];
  streaks: Record<string, StreakLike>;
  history: Record<string, Record<string, unknown>>;
}

const SHELF_KEY = "rmf:shelf";
const STREAK_PREFIX = "rmf:streak:";
const HISTORY_PREFIX = "rmf:history:";
const PUSH_DEBOUNCE_MS = 4000;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function collectLocalProgress(): ProgressBlob {
  const blob: ProgressBlob = { shelf: readJson(SHELF_KEY, []), streaks: {}, history: {} };
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(STREAK_PREFIX)) {
      blob.streaks[key.slice(STREAK_PREFIX.length)] = readJson(key, {
        current: 0,
        best: 0,
        lastPlayedDate: null,
      });
    } else if (key.startsWith(HISTORY_PREFIX)) {
      blob.history[key.slice(HISTORY_PREFIX.length)] = readJson(key, {});
    }
  }
  return blob;
}

function mergeIntoLocal(remote: ProgressBlob): void {
  // Shelf: union by perfumeId; a discovery on any device counts everywhere.
  const localShelf = readJson<ShelfItemLike[]>(SHELF_KEY, []);
  const seen = new Set(localShelf.map((s) => s.perfumeId));
  const mergedShelf = [...localShelf];
  for (const item of remote.shelf ?? []) {
    if (item?.perfumeId && !seen.has(item.perfumeId)) {
      seen.add(item.perfumeId);
      mergedShelf.push(item);
    }
  }
  window.localStorage.setItem(SHELF_KEY, JSON.stringify(mergedShelf));

  // Streaks: best is a lifetime max; current follows whichever device played
  // most recently, since that's the streak that's actually alive.
  for (const [game, remoteStreak] of Object.entries(remote.streaks ?? {})) {
    const key = STREAK_PREFIX + game;
    const local = readJson<StreakLike>(key, { current: 0, best: 0, lastPlayedDate: null });
    const remoteNewer =
      (remoteStreak.lastPlayedDate ?? "") > (local.lastPlayedDate ?? "");
    const merged: StreakLike = {
      best: Math.max(local.best, remoteStreak.best),
      current: remoteNewer ? remoteStreak.current : local.current,
      lastPlayedDate: remoteNewer ? remoteStreak.lastPlayedDate : local.lastPlayedDate,
    };
    window.localStorage.setItem(key, JSON.stringify(merged));
  }

  // History: per game per date; local wins on conflict (it's the device in
  // active use), remote fills in days this device never saw.
  for (const [game, remoteDays] of Object.entries(remote.history ?? {})) {
    const key = HISTORY_PREFIX + game;
    const local = readJson<Record<string, unknown>>(key, {});
    window.localStorage.setItem(key, JSON.stringify({ ...remoteDays, ...local }));
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced fire-and-forget mirror of local progress to the account.
 * Silently no-ops when logged out (the endpoint 401s) or offline. */
export function schedulePush(): void {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    fetch("/api/sync", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectLocalProgress()),
    }).catch(() => {});
  }, PUSH_DEBOUNCE_MS);
}

let pulledThisLoad = false;

/** On login (or page load while logged in): fetch the account's saved
 * progress, merge it into this device, then push the merged result back. */
export async function pullAndMergeProgress(): Promise<void> {
  if (typeof window === "undefined" || pulledThisLoad) return;
  pulledThisLoad = true;
  try {
    const res = await fetch("/api/sync");
    if (!res.ok) return;
    const { data } = (await res.json()) as { data: ProgressBlob | null };
    if (data) mergeIntoLocal(data);
    schedulePush();
  } catch {
    // offline or transient failure; localStorage remains authoritative
  }
}
