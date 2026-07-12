"use client";

const EXPRESSIONS = [
  "sparkle",
  "happy",
  "wink",
  "starry",
  "grin",
  "sleepy",
  "surprised",
  "love",
  "cool",
  "laughing",
  "shy",
  "smirk",
] as const;
type Expression = (typeof EXPRESSIONS)[number];

const BLUSH = (
  <>
    <circle cx="24" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
    <circle cx="40" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
  </>
);

function Face({ expression }: { expression: Expression }) {
  switch (expression) {
    case "sparkle":
      // The logo's diamond: the mascot "resets" to the brand mark each cycle.
      return (
        <path
          d="M32 30.5 L33.9 36.1 L39.5 38 L33.9 39.9 L32 45.5 L30.1 39.9 L24.5 38 L30.1 36.1 Z"
          fill="#4B2E2B"
        />
      );
    case "wink":
      return (
        <>
          <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
          <path d="M34.3 36 L38 36" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M27.5 41 Q32 45 36.5 41" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          {BLUSH}
        </>
      );
    case "starry":
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
          {BLUSH}
        </>
      );
    case "grin":
      return (
        <>
          <path d="M26.5 34.5 Q28 38 29.5 34.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M34.5 34.5 Q36 38 37.5 34.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M26 41 Q32 47 38 41 Q32 44.5 26 41 Z"
            fill="#4B2E2B"
          />
          {BLUSH}
        </>
      );
    case "sleepy":
      return (
        <>
          <path d="M25.5 36.5 Q28 35 30.5 36.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M33.5 36.5 Q36 35 38.5 36.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M29 41.5 Q32 43 35 41.5" stroke="#4B2E2B" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "surprised":
      return (
        <>
          <circle cx="28" cy="36.5" r="2.1" fill="#4B2E2B" />
          <circle cx="36" cy="36.5" r="2.1" fill="#4B2E2B" />
          <circle cx="32" cy="42.5" r="2" fill="none" stroke="#4B2E2B" strokeWidth="1.6" />
          {BLUSH}
        </>
      );
    case "love":
      return (
        <>
          <path
            d="M28 35.5 C28 34.3 29 33.6 29.9 34.2 C30.5 34.6 30.7 35.2 30.7 35.2 C30.7 35.2 30.9 34.6 31.5 34.2 C32.4 33.6 33.4 34.3 33.4 35.5 C33.4 37 30.7 38.5 30.7 38.5 C30.7 38.5 28 37 28 35.5 Z"
            fill="#C08552"
          />
          <path
            d="M33.6 35.5 C33.6 34.3 34.6 33.6 35.5 34.2 C36.1 34.6 36.3 35.2 36.3 35.2 C36.3 35.2 36.5 34.6 37.1 34.2 C38 33.6 39 34.3 39 35.5 C39 37 36.3 38.5 36.3 38.5 C36.3 38.5 33.6 37 33.6 35.5 Z"
            fill="#C08552"
          />
          <path d="M27.5 41 Q32 45 36.5 41" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "cool":
      return (
        <>
          <rect x="24.5" y="34.5" width="6" height="3.4" rx="1.2" fill="#4B2E2B" />
          <rect x="33.5" y="34.5" width="6" height="3.4" rx="1.2" fill="#4B2E2B" />
          <path d="M30.5 36 L33.5 36" stroke="#4B2E2B" strokeWidth="1.4" />
          <path d="M27.5 41.5 Q32 44 36.5 41.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "laughing":
      return (
        <>
          <path d="M25.5 37 Q28 33.5 30.5 37" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M33.5 37 Q36 33.5 38.5 37" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M25.5 41 Q32 48 38.5 41 Q32 46 25.5 41 Z" fill="#4B2E2B" />
          {BLUSH}
        </>
      );
    case "shy":
      return (
        <>
          <path d="M25.5 36.5 Q28 35 30.5 36.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M33.5 36.5 Q36 35 38.5 36.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 41.5 Q32 43 34 41.5" stroke="#4B2E2B" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="40" r="2.3" fill="#C08552" opacity="0.75" />
          <circle cx="40" cy="40" r="2.3" fill="#C08552" opacity="0.75" />
        </>
      );
    case "smirk":
      return (
        <>
          <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
          <circle cx="36" cy="36" r="1.9" fill="#4B2E2B" />
          <path d="M28 41.5 Q34 44.5 37.5 40.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          {BLUSH}
        </>
      );
    case "happy":
    default:
      return (
        <>
          <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
          <circle cx="36" cy="36" r="1.9" fill="#4B2E2B" />
          <path d="M27.5 41 Q32 45 36.5 41" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          {BLUSH}
        </>
      );
  }
}

// One 12th of the shared mascot-expr-cycle animation (13.2s / 12 faces).
const SLICE_SECONDS = 13.2 / EXPRESSIONS.length;

/** The logo bottle come to life: cycles through expressions (starting from
 * the logo's own sparkle) and asks the Concierge's opening question. Every
 * expression is rendered at once, each staggered by a positive animation-delay
 * (face i waits i slices before its turn, then loops every full cycle after),
 * so the cycle keeps running via the compositor even if the tab's JS timers
 * get throttled or frozen in the background. */
export default function Mascot({ className }: { className?: string }) {
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
        {EXPRESSIONS.map((expression, i) => (
          <g
            key={expression}
            className="mascot-face"
            style={{ animationDelay: `${i * SLICE_SECONDS}s` }}
          >
            <Face expression={expression} />
          </g>
        ))}
      </svg>
    </div>
  );
}
