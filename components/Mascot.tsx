/** The logo bottle with a face: same geometry as Logo.tsx, but the cream
 * label is a smiling face and the spray puffs pulse. Purely decorative. */
export default function Mascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 72"
      className={className}
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
      <circle cx="28" cy="36" r="1.9" fill="#4B2E2B" />
      <circle cx="36" cy="36" r="1.9" fill="#4B2E2B" />
      <path
        d="M27.5 41 Q32 45 36.5 41"
        stroke="#4B2E2B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
      <circle cx="40" cy="40" r="1.7" fill="#C08552" opacity="0.55" />
    </svg>
  );
}
