export interface ParsedRecommendation {
  picks: string[];
  reason: string;
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Parses and validates the model's WRAPUP JSON response. Returns null if the JSON
 * is malformed, missing fields, or ends up with fewer than 2 valid catalog IDs after
 * dropping anything not in `validIds` — callers should retry once on null.
 */
export function parseRecommendation(
  raw: string,
  validIds: Set<string>
): ParsedRecommendation | null {
  const cleaned = stripCodeFences(raw);
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.picks) || typeof obj.reason !== "string") return null;

  const picks = obj.picks.filter((id): id is string => typeof id === "string" && validIds.has(id));
  const deduped = Array.from(new Set(picks));
  if (deduped.length < 2) return null;

  return { picks: deduped.slice(0, 3), reason: obj.reason.trim() };
}
