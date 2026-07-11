import { NextRequest, NextResponse } from "next/server";
import { getDailyAnswer } from "@/lib/dailyAnswer";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { computeScentleFeedback, getRevealedNotes } from "@/lib/scentle";
import { getFamousCatalog, getFullCatalog } from "@/lib/serverCatalog";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RATE_LIMIT_PER_MINUTE = 60;
type GameName = "scentle" | "detective";

interface GuessBody {
  date: string;
  gameName: GameName;
  action: "guess" | "reveal" | "peek";
  guessId?: string;
  revealCount?: number;
}

export async function POST(req: NextRequest) {
  const withinRateLimit = await checkRateLimit(clientIp(req), RATE_LIMIT_PER_MINUTE);
  if (!withinRateLimit) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Partial<GuessBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { date, gameName, action, guessId, revealCount } = body;
  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (gameName !== "scentle" && gameName !== "detective") {
    return NextResponse.json({ error: "invalid_game" }, { status: 400 });
  }
  if (action !== "guess" && action !== "reveal" && action !== "peek") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const famous = getFamousCatalog();
  if (famous.length === 0) {
    return NextResponse.json({ error: "catalog_unavailable" }, { status: 503 });
  }
  const answer = getDailyAnswer(famous, date, gameName);

  if (action === "reveal") {
    return NextResponse.json({ answer }, { headers: { "Cache-Control": "public, max-age=300" } });
  }

  if (action === "peek") {
    if (gameName !== "detective") {
      return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    }
    const notes = getRevealedNotes(answer, Number(revealCount ?? 0));
    return NextResponse.json({ notes });
  }

  // action === "guess"
  if (!guessId || typeof guessId !== "string") {
    return NextResponse.json({ error: "missing_guess" }, { status: 400 });
  }
  const full = getFullCatalog();
  const guess = full.find((p) => p.id === guessId);
  if (!guess) {
    return NextResponse.json({ error: "unknown_perfume" }, { status: 400 });
  }

  if (gameName === "scentle") {
    const feedback = computeScentleFeedback(guess, answer);
    const payload: { feedback: typeof feedback; answer?: typeof answer } = { feedback };
    if (feedback.correct) payload.answer = answer;
    return NextResponse.json(payload);
  }

  // detective
  const correct = guess.id === answer.id;
  const notes = getRevealedNotes(answer, Number(revealCount ?? 0));
  const payload: { correct: boolean; notes: string[]; answer?: typeof answer } = {
    correct,
    notes,
  };
  if (correct) payload.answer = answer;
  return NextResponse.json(payload);
}
