"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { track } from "@/lib/analytics";
import type { PerfumeEntry } from "@/lib/types";
import { useAuth } from "@/lib/useAuth";
import { useOffers } from "@/lib/useOffers";

const MAX_CHARS = 500;
const GEMINI_KEY_STORAGE = "rmf:gemini-key";

interface Turn {
  role: "user" | "assistant";
  content: string;
  recommendations?: { picks: PerfumeEntry[]; reason: string };
}

export default function ChatPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [energyPct, setEnergyPct] = useState(100);
  const [locked, setLocked] = useState(false);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [lastRecommendation, setLastRecommendation] = useState<Turn["recommendations"] | null>(
    null
  );
  const offers = useOffers();
  const { username } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [geminiKey, setGeminiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");

  useEffect(() => {
    setGeminiKey(window.localStorage.getItem(GEMINI_KEY_STORAGE) ?? "");
  }, []);

  function saveGeminiKey() {
    const k = keyInput.trim();
    if (!k) return;
    window.localStorage.setItem(GEMINI_KEY_STORAGE, k);
    setGeminiKey(k);
    setKeyInput("");
  }

  function removeGeminiKey() {
    window.localStorage.removeItem(GEMINI_KEY_STORAGE);
    setGeminiKey("");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, locked]);

  async function send() {
    const text = input.trim();
    if (!text || text.length > MAX_CHARS || loading || locked) return;

    const nextTurns: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(nextTurns);
    setInput("");
    setLoading(true);
    track("chat_message", { length: text.length });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextTurns.map((t) => ({ role: t.role, content: t.content })),
          ...(geminiKey ? { geminiKey } : {}),
        }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        if (data.locked) {
          setLocked(true);
          setResetAt(data.resetAt ?? null);
          track("chat_locked", {});
          setLoading(false);
          return;
        }
        setTurns([
          ...nextTurns,
          { role: "assistant", content: "Give it a moment, you're sending messages a bit fast." },
        ]);
        setLoading(false);
        return;
      }

      if (res.status === 401) {
        setTurns([
          ...nextTurns,
          { role: "assistant", content: "You need to be logged in to chat with me. Log in and come right back." },
        ]);
        setLoading(false);
        return;
      }

      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "bad_gemini_key") {
          setTurns([
            ...nextTurns,
            {
              role: "assistant",
              content:
                "Google rejected that Gemini key. Double-check it in the key section below, or remove it to use the shared budget.",
            },
          ]);
          setLoading(false);
          return;
        }
      }

      if (!res.ok) {
        setTurns([
          ...nextTurns,
          { role: "assistant", content: "The Concierge is offline right now, try again soon." },
        ]);
        setLoading(false);
        return;
      }

      const data: {
        state: string;
        reply?: string;
        recommendations?: { picks: PerfumeEntry[]; reason: string } | null;
        remainingPct: number;
      } = await res.json();

      setEnergyPct(data.remainingPct);
      if (data.recommendations) {
        setLastRecommendation(data.recommendations);
        setTurns([
          ...nextTurns,
          {
            role: "assistant",
            // NORMAL replies carry their own text with cards attached;
            // WRAPUP responses only have the one-line reason.
            content: data.reply || data.recommendations.reason,
            recommendations: data.recommendations,
          },
        ]);
      } else {
        setTurns([...nextTurns, { role: "assistant", content: data.reply ?? "" }]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (locked) {
    return (
      <div className="flex flex-col gap-7">
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
          The Concierge
        </h1>
        <p className="text-xl font-bold text-ink-950">
          The Concierge is back tomorrow, try today&apos;s Scentle meanwhile.
        </p>
        {resetAt && (
          <p className="text-sm font-medium text-ink-400">
            Resets {new Date(resetAt).toLocaleString()}
          </p>
        )}
        {lastRecommendation && (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400">
              Your last picks
            </p>
            {lastRecommendation.picks.map((p) => (
              <ResultCard key={p.id} perfume={p} surface="chat" offer={offers[p.id]} />
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/scentle">Play Scentle</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/roulette">Try Roulette</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
          The Concierge
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Tell me what you like, I&apos;ll point you to a few bottles.
        </p>
      </div>

      {geminiKey ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-hit/10 border-2 border-hit/25 px-3 py-1.5 text-sm font-extrabold text-ink-950">
            Using your Gemini key, unlimited chats
          </span>
          <button
            type="button"
            onClick={removeGeminiKey}
            className="text-sm font-bold text-ink-400 underline underline-offset-2 hover:text-ink-950 transition-colors"
          >
            remove key
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Progress value={energyPct} className="flex-1" />
          <span className="text-sm font-extrabold text-ink-400 shrink-0">{energyPct}% energy</span>
          <InfoTooltip label="What the energy meter means" align="end">
            <p className="font-extrabold text-ink-950 mb-2">Concierge energy</p>
            <p>
              This tracks today&apos;s shared chat budget. As it runs low, I&apos;ll wrap up with
              2&ndash;3 recommendations instead of chatting further. It fully resets every day, so
              come back tomorrow if it runs out. Add your own Gemini key below to skip the budget
              entirely.
            </p>
          </InfoTooltip>
        </div>
      )}

      <div className="flex flex-col gap-4 min-h-[8rem]">
        {turns.map((t, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3 text-base font-medium ${
                t.role === "user"
                  ? "self-end bg-amber-400 text-ink-950"
                  : "self-start border-2 border-ink-950/8 bg-cream-100 text-ink-950 shadow-card"
              }`}
            >
              {t.content}
            </div>
            {t.recommendations && (
              <div className="flex flex-col gap-4">
                {t.recommendations.picks.map((p) => (
                  <ResultCard key={p.id} perfume={p} surface="chat" offer={offers[p.id]} />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-base font-medium text-ink-400">Thinking...</p>}
        <div ref={bottomRef} />
      </div>

      {username === null ? (
        <div className="flex flex-col items-start gap-3 rounded-3xl border-2 border-ink-950/8 bg-cream-100 p-6 shadow-card">
          <p className="text-lg font-extrabold text-ink-950">
            The Concierge chats with members only.
          </p>
          <p className="text-base font-medium text-ink-400">
            Sign in with Google (takes ten seconds) and your account gets its own daily chat
            budget.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Sign in with Google</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="What are you in the mood for?"
              disabled={loading || username === undefined}
              className="tap-target flex-1"
            />
            <Button onClick={send} disabled={loading || !input.trim() || username === undefined} size="lg">
              Send
            </Button>
          </div>

          {!geminiKey && (
            <details className="rounded-2xl border-2 border-ink-950/8 bg-cream-100 px-5 py-4">
              <summary className="text-sm font-extrabold lowercase text-ink-900">
                bring your own Gemini API key (unlimited chats)
              </summary>
              <div className="mt-3 flex flex-col gap-2.5">
                <p className="text-sm font-medium text-ink-400">
                  Paste a free API key from Google AI Studio and chat without the shared daily
                  budget. The key is saved only in this browser and sent only with your own
                  messages, we never store it on our servers.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveGeminiKey()}
                    placeholder="AIza..."
                    autoComplete="off"
                    className="h-11 flex-1 text-base"
                  />
                  <Button
                    onClick={saveGeminiKey}
                    disabled={!keyInput.trim().startsWith("AIza")}
                    size="sm"
                    className="h-11 px-5"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
