"use client";

const EXPRESSIONS = [
  "sparkle",
  "happy",
  "wink",
  "starry",
  "grin",
  "sleepy",
  "dizzy",
  "surprised",
  "laughing",
  "smirk",
  "nervous",
  "silly",
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
      // Same open eyes as happy, a bigger open smile: happy turned up a notch.
      return (
        <>
          <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
          <circle cx="36" cy="36" r="1.9" fill="#4B2E2B" />
          <path d="M26 41 Q32 47 38 41 Q32 44.5 26 41 Z" fill="#4B2E2B" />
          {BLUSH}
        </>
      );
    case "sleepy":
      // Flat drowsy eyes, flat mouth, plus two drifting "z"s: unmistakably asleep.
      return (
        <>
          <path d="M25.5 36.5 L30.5 36.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M33.5 36.5 L38.5 36.5" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M29 41.5 L35 41.5" stroke="#4B2E2B" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M37 27.5 L38.8 27.5 L37 29.8 L38.8 29.8"
            fill="none"
            stroke="#4B2E2B"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40 21 L43.2 21 L40 24.5 L43.2 24.5"
            fill="none"
            stroke="#4B2E2B"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {BLUSH}
        </>
      );
    case "dizzy":
      // X eyes and a wobbly mouth: knocked for a loop.
      return (
        <>
          <path
            d="M26.5 34.7 L29.3 37.5 M29.3 34.7 L26.5 37.5"
            stroke="#4B2E2B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M34.7 34.7 L37.5 37.5 M37.5 34.7 L34.7 37.5"
            stroke="#4B2E2B"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M27.5 42 Q29.5 40.3 31.5 42 Q33.5 43.7 35.5 42"
            stroke="#4B2E2B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {BLUSH}
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
    case "laughing":
      // Squeezed-shut chevron eyes, a big open mouth, and a joyful tear: laughing hard.
      return (
        <>
          <path
            d="M25.5 37.5 L28 34.5 L30.5 37.5"
            stroke="#4B2E2B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M33.5 37.5 L36 34.5 L38.5 37.5"
            stroke="#4B2E2B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M26 41 Q32 47 38 41 Q32 44.5 26 41 Z" fill="#4B2E2B" />
          {/* A single tear on the left, tracking down clear of the blush spot;
              the right blush stays for a touch of warmth. */}
          <path
            d="M23.6 39.5 C22.2 41.6 22.5 43.6 23.9 44 C25.3 43.6 25.2 41.6 23.6 39.5 Z"
            fill="#8C5A3C"
          />
          <circle cx="40" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
        </>
      );
    case "nervous":
      // Small worried eyes, a wobbly mouth, and a single sweat drop.
      return (
        <>
          <circle cx="28" cy="36" r="1.6" fill="#4B2E2B" />
          <circle cx="36" cy="36" r="1.6" fill="#4B2E2B" />
          <path
            d="M29 42 Q30.5 41 32 42 Q33.5 43 35 42"
            stroke="#4B2E2B"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M42.5 22 C41.3 24.2 41.5 26 42.7 26.4 C43.9 26 43.9 24.2 42.5 22 Z"
            fill="#8C5A3C"
          />
          {BLUSH}
        </>
      );
    case "smirk":
      // Both pupils glance the same way inside a thin socket: a sly side-eye.
      return (
        <>
          <ellipse cx="28" cy="36" rx="2.3" ry="1.8" fill="none" stroke="#4B2E2B" strokeWidth="1.2" />
          <circle cx="29" cy="36" r="1" fill="#4B2E2B" />
          <ellipse cx="36" cy="36" rx="2.3" ry="1.8" fill="none" stroke="#4B2E2B" strokeWidth="1.2" />
          <circle cx="37" cy="36" r="1" fill="#4B2E2B" />
          <path d="M29 41.5 L36 41" stroke="#4B2E2B" strokeWidth="2" strokeLinecap="round" />
          {BLUSH}
        </>
      );
    case "silly":
      // Close-set eyes and a tongue sticking out of an open grin.
      return (
        <>
          <circle cx="29" cy="36" r="1.7" fill="#4B2E2B" />
          <circle cx="35" cy="36" r="1.7" fill="#4B2E2B" />
          <path d="M27 41 Q32 46 37 41 Z" fill="#4B2E2B" />
          <ellipse cx="32" cy="44.3" rx="2" ry="1.8" fill="#C08552" />
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
