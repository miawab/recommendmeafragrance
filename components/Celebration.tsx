"use client";

import { PartyPopper } from "lucide-react";
import type { CSSProperties } from "react";

const TONES = ["bg-amber-400", "bg-ink-400", "bg-ink-950"];

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 55 + (i % 3) * 22;
  return {
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance,
    delay: (i % 4) * 45,
    tone: TONES[i % TONES.length],
  };
});

export default function Celebration({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="relative h-0 w-0 motion-reduce:hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            style={
              {
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                animationDelay: `${p.delay}ms`,
              } as CSSProperties
            }
            className={`absolute left-0 top-0 h-2.5 w-2.5 rounded-full ${p.tone} animate-burst-particle`}
          />
        ))}
      </div>
      <PartyPopper
        className="h-11 w-11 text-amber-600 animate-bounce-in motion-reduce:animate-none"
        strokeWidth={2.5}
      />
    </div>
  );
}
