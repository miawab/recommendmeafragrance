// Deterministic hashing + shuffling so daily answers are identical across devices
// without ever shipping the answer itself; only this derivation logic is public.

export function seededHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeterministic<T>(items: T[], seed: number): T[] {
  const arr = items.slice();
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Picks a deterministic daily index into a pre-shuffled pool for a given game. */
export function dailyIndex(date: string, gameName: string, poolLength: number): number {
  if (poolLength <= 0) return 0;
  return seededHash(`${date}:${gameName}`) % poolLength;
}
