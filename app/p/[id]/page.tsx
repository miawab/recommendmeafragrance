import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ResultCard from "@/components/ResultCard";
import { findClosestMatches, perfumeNoteSet } from "@/lib/jaccard";
import { getFullCatalog, getOffers } from "@/lib/serverCatalog";

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return getFullCatalog().map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const perfume = getFullCatalog().find((p) => p.id === params.id);
  if (!perfume) return {};
  return {
    title: `${perfume.name} by ${perfume.brand} | recommendmeafragrance`,
    description: perfume.funFact || `${perfume.name} by ${perfume.brand}, notes and where to buy.`,
  };
}

export default function PerfumeDetailPage({ params }: PageProps) {
  const catalog = getFullCatalog();
  const perfume = catalog.find((p) => p.id === params.id);
  if (!perfume) notFound();

  const offers = getOffers();
  const similar = findClosestMatches(perfumeNoteSet(perfume), catalog, 4, perfume.id);

  return (
    <div className="flex flex-col gap-8">
      <ResultCard perfume={perfume} surface="detail" offer={offers[perfume.id]} />

      <div className="rounded-3xl border-2 border-ink-950/8 bg-cream-100 p-6 shadow-card">
        <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400 mb-4">
          Full note pyramid
        </p>
        <div className="grid grid-cols-1 gap-5 text-base text-ink-800 sm:grid-cols-3 sm:gap-4">
          {(["top", "heart", "base"] as const).map((layer) => (
            <div key={layer}>
              <p className="uppercase text-[11px] font-extrabold tracking-wider text-ink-400 mb-1.5">
                {layer === "top" ? "Top" : layer === "heart" ? "Heart" : "Base"}
              </p>
              {perfume.notes[layer].length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {perfume.notes[layer].map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-ink-950/10 bg-cream-200 px-2.5 py-1 text-sm font-bold text-ink-900"
                    >
                      {n.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium text-ink-400">—</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="flex flex-col gap-5">
          <p className="text-sm font-extrabold uppercase tracking-widest text-ink-400">
            Similar fragrances
          </p>
          {similar.map((m) => (
            <ResultCard
              key={m.perfume.id}
              perfume={m.perfume}
              surface="detail"
              offer={offers[m.perfume.id]}
              headline={`${Math.round(m.similarity * 100)}% similar`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
