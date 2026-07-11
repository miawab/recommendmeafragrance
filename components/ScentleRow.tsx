import type { PerfumeEntry } from "@/lib/types";
import type { ScentleFeedback } from "@/lib/scentle";

function Cell({
  label,
  tone,
  delay,
  children,
}: {
  label: string;
  tone: "hit" | "partial" | "miss";
  delay: number;
  children: React.ReactNode;
}) {
  const bg = tone === "hit" ? "bg-hit" : tone === "partial" ? "bg-partial" : "bg-miss";
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      <p className="text-center text-[9px] font-extrabold uppercase tracking-normal text-ink-400 sm:text-[10px] sm:tracking-wider">
        {label}
      </p>
      <div
        style={{ animationDelay: `${delay}ms` }}
        className={`${bg} animate-tile-flip flex h-12 w-full items-center justify-center rounded-lg text-lg shadow-card [transform-style:preserve-3d] sm:h-16 sm:rounded-xl sm:text-2xl font-extrabold text-white`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ScentleRow({
  guess,
  feedback,
}: {
  guess: PerfumeEntry;
  feedback: ScentleFeedback;
}) {
  const dirSymbol = (s: "exact" | "up" | "down") => (s === "exact" ? "✓" : s === "up" ? "↑" : "↓");
  const dirTone = (s: "exact" | "up" | "down") => (s === "exact" ? "hit" : "partial");

  return (
    <div className="animate-pop-in">
      <p className="mb-2 text-base font-bold text-ink-950">
        {guess.name} <span className="font-medium text-ink-400">— {guess.brand}</span>
      </p>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5">
        <Cell delay={0} label="Brand" tone={feedback.brand === "exact" ? "hit" : feedback.brand === "partial" ? "partial" : "miss"}>
          {feedback.brand === "exact" ? "✓" : feedback.brand === "partial" ? "~" : "✗"}
        </Cell>
        <Cell delay={80} label="Year" tone={feedback.year ? dirTone(feedback.year.status) : "miss"}>
          {feedback.year ? dirSymbol(feedback.year.status) : "—"}
        </Cell>
        <Cell delay={160} label="Gender" tone={feedback.gender === "exact" ? "hit" : "miss"}>
          {feedback.gender === "exact" ? "✓" : "✗"}
        </Cell>
        <Cell delay={240} label="Price" tone={dirTone(feedback.priceTier.status)}>
          {dirSymbol(feedback.priceTier.status)}
        </Cell>
        <Cell delay={320} label="Conc." tone={feedback.concentration === "exact" ? "hit" : "miss"}>
          {feedback.concentration === "exact" ? "✓" : "✗"}
        </Cell>
        <Cell delay={400} label="Notes" tone={feedback.correct ? "hit" : feedback.sharedNotes > 0 ? "partial" : "miss"}>
          {feedback.sharedNotes}
        </Cell>
      </div>
    </div>
  );
}
