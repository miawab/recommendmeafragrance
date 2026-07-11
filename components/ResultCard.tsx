"use client";

import Link from "next/link";
import { SprayCan } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Offer, PerfumeEntry, Surface } from "@/lib/types";
import { track } from "@/lib/analytics";

const CJ_SID_PREFIX = "recommendmeafragrance";

interface ResultCardProps {
  perfume: PerfumeEntry;
  surface: Surface;
  offer?: Offer | null;
  headline?: string;
  className?: string;
  revealDelay?: number;
}

// Strictly the 4-color palette: price tiers read as a light-to-dark ramp
// (cheaper = lighter tint, pricier = darker chocolate), not distinct hues.
const PRICE_TIER: Record<number, { label: string; classes: string; iconTone: string }> = {
  1: { label: "Budget", classes: "bg-cream-300 text-ink-950 border-ink-950/15", iconTone: "bg-cream-300 text-ink-950" },
  2: { label: "Mid-Range", classes: "bg-amber-200 text-ink-950 border-ink-950/15", iconTone: "bg-amber-200 text-ink-950" },
  3: { label: "Designer", classes: "bg-amber-400 text-white border-transparent", iconTone: "bg-amber-400 text-white" },
  4: { label: "Niche", classes: "bg-ink-400 text-white border-transparent", iconTone: "bg-ink-400 text-cream-100" },
  5: { label: "Ultra", classes: "bg-ink-950 text-cream-100 border-transparent", iconTone: "bg-ink-950 text-cream-100" },
};

export default function ResultCard({ perfume, surface, offer, headline, className, revealDelay = 30 }: ResultCardProps) {
  const [revealed, setRevealed] = useState(false);
  const tier = PRICE_TIER[perfume.priceTier] ?? PRICE_TIER[2];

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), revealDelay);
    track("card_view", { perfumeId: perfume.id, surface });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfume.id]);

  const buyHref = offer
    ? `${offer.deepLink}${offer.deepLink.includes("?") ? "&" : "?"}sid=${CJ_SID_PREFIX}_${surface}`
    : `https://www.google.com/search?q=${encodeURIComponent(`${perfume.brand} ${perfume.name} buy`)}`;

  return (
    <Card
      className={`p-6 transition-all duration-300 hover:shadow-card-lg hover:-translate-y-0.5 ${
        revealed ? "opacity-100 scale-100 animate-pop-in" : "opacity-0 scale-95"
      } ${className ?? ""}`}
    >
      {headline && <p className="text-base font-extrabold text-amber-600 mb-2">{headline}</p>}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-card ${tier.iconTone}`}>
            <SprayCan className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wider text-ink-400">
              {perfume.brand}
            </p>
            <Link
              href={`/p/${perfume.id}`}
              className="font-display text-3xl font-extrabold text-ink-950 hover:underline decoration-4 underline-offset-4"
            >
              {perfume.name}
            </Link>
          </div>
        </div>
        <Badge className={`shrink-0 ${tier.classes}`}>{tier.label}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-ink-800 sm:grid-cols-3">
        <NotesColumn label="Top" notes={perfume.notes.top} />
        <NotesColumn label="Heart" notes={perfume.notes.heart} />
        <NotesColumn label="Base" notes={perfume.notes.base} />
      </div>

      {perfume.funFact && <p className="mt-5 text-base text-ink-400">{perfume.funFact}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-bold text-ink-900">
          {offer ? (
            <span>
              {offer.currency} {offer.price.toFixed(2)} · {offer.merchant}
            </span>
          ) : (
            <span className="font-normal text-ink-400">No live offer yet, here&apos;s a place to look.</span>
          )}
        </div>
        <Button asChild size="lg" onClick={() => track("cj_click", { perfumeId: perfume.id, surface })}>
          <a href={buyHref} target="_blank" rel="sponsored noopener">
            {offer ? "Buy now" : "Find it"}
          </a>
        </Button>
      </div>
      <p className="mt-4 text-xs font-medium text-ink-400/70">
        We may earn a commission if you buy through this link. It supports the site.
      </p>
    </Card>
  );
}

function NotesColumn({ label, notes }: { label: string; notes: string[] }) {
  const shown = notes.slice(0, 4);
  return (
    <div>
      <p className="uppercase text-[11px] font-extrabold tracking-wider text-ink-400/70 mb-1.5">
        {label}
      </p>
      {shown.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {shown.map((n) => (
            <span
              key={n}
              className="rounded-full border border-ink-950/10 bg-cream-200 px-2 py-0.5 text-xs font-bold text-ink-900"
            >
              {n.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      ) : (
        <p className="font-medium text-ink-400">—</p>
      )}
    </div>
  );
}
