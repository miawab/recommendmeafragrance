"use client";

import { useEffect, useState } from "react";

const EXPRESSIONS = ["sparkle", "happy", "wink", "starry"] as const;
type Expression = (typeof EXPRESSIONS)[number];

function Face({ expression }: { expression: Expression }) {
  if (expression === "sparkle") {
    // The logo's diamond: the mascot "resets" to the brand mark each cycle.
    return (
      <path
        d="M32 30.5 L33.9 36.1 L39.5 38 L33.9 39.9 L32 45.5 L30.1 39.9 L24.5 38 L30.1 36.1 Z"
        fill="#4B2E2B"
      />
    );
  }
  if (expression === "wink") {
    return (
      <>
        <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
        <path d="M34.3 36 L38 36" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
        <path d="M27.5 41 Q32 45 36.5 41" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
        <circle cx="40" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
      </>
    );
  }
  if (expression === "starry") {
    return (
      <>
        <path
          d="M28 33.2 L28.9 35.1 L30.8 36 L28.9 36.9 L28 38.8 L27.1 36.9 L25.2 36 L27.1 35.1 Z"
          fill="#4B2E2B"
        />
        <path
          d="M36 33.2 L36.9 35.1 L38.8 36 L36.9 36.9 L36 38.8 L35.1 36.9 L33.2 36 L35.1 35.1 Z"
          fill="#4B2E2B"
        />
        <circle cx="32" cy="42" r="1.7" fill="#4B2E2B" />
        <circle cx="24" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
        <circle cx="40" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
      </>
    );
  }
  // happy
  return (
    <>
      <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
      <circle cx="36" cy="36" r="1.9" fill="#4B2E2B" />
      <path d="M27.5 41 Q32 45 36.5 41" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
      <circle cx="40" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
    </>
  );
}

/** The logo bottle come to life: cycles through expressions (starting from
 * the logo's own sparkle) and asks the Concierge's opening question. */
export default function Mascot({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const expression = EXPRESSIONS[idx];

  useEffect(() => {
    // The brand-mark sparkle lingers; the faces flip through quicker.
    const holdMs = expression === "sparkle" ? 2600 : 1800;
    const t = setTimeout(() => setIdx((i) => (i + 1) % EXPRESSIONS.length), holdMs);
    return () => clearTimeout(t);
  }, [expression]);

  return (
    <div className={className}>
      <div className="relative mb-1 -rotate-2 rounded-2xl border-2 border-ink-950/10 bg-white px-3 py-1.5 text-center text-sm font-extrabold lowercase text-ink-950 shadow-card">
        what mood are you in?
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b-2 border-r-2 border-ink-950/10 bg-white"
        />
      </div>
      <svg
        viewBox="0 0 64 72"
        className="mx-auto w-28"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="32" cy="67" rx="15" ry="3" fill="#4B2E2B" opacity="0.08" />
        <circle className="mascot-puff" cx="45" cy="7" r="2.5" fill="#8C5A3C" />
        <circle
          className="mascot-puff"
          style={{ animationDelay: "0.5s" }}
          cx="51.5"
          cy="11"
          r="2"
          fill="#C08552"
        />
        <circle
          className="mascot-puff"
          style={{ animationDelay: "1.1s" }}
          cx="47"
          cy="14.5"
          r="1.6"
          fill="#8C5A3C"
        />
        <rect x="25" y="4" width="14" height="10" rx="4" fill="#4B2E2B" />
        <rect x="28" y="12" width="8" height="7" rx="2.5" fill="#8C5A3C" />
        <rect x="13" y="17" width="38" height="42" rx="15" fill="#C08552" />
        <circle cx="32" cy="38" r="11" fill="#FFF8F0" />
        {/* key remount restarts the pop-in on every expression change */}
        <g key={expression} className="mascot-face">
          <Face expression={expression} />
        </g>
      </svg>
    </div>
  );
}
