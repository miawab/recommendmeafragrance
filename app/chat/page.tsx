"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import InfoTooltip from "@/components/InfoTooltip";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { track } from "@/lib/analytics";
import { getOrCreateUserId } from "@/lib/shelf";
import type { PerfumeEntry } from "@/lib/types";
import { useOffers } from "@/lib/useOffers";

const MAX_CHARS = 500;

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getOrCreateUserId();
  }, []);

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
            content: data.recommendations.reason,
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

      <div className="flex items-center gap-3">
        <Progress value={energyPct} className="flex-1" />
        <span className="text-sm font-extrabold text-ink-400 shrink-0">{energyPct}% energy</span>
        <InfoTooltip label="What the energy meter means" align="end">
          <p className="font-extrabold text-ink-950 mb-2">Concierge energy</p>
          <p>
            This tracks today&apos;s shared chat budget. As it runs low, I&apos;ll wrap up with
            2&ndash;3 recommendations instead of chatting further. It fully resets every day, so
            come back tomorrow if it runs out.
          </p>
        </InfoTooltip>
      </div>

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

      <div className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What are you in the mood for?"
          disabled={loading}
          className="tap-target flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="lg">
          Send
        </Button>
      </div>
    </div>
  );
}
