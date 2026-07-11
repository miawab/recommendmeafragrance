import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "recommendmeafragrance, play a game, find your next fragrance";

/** Social-share card: bottle mark plus wordmark on cream. Text renders in
 * next/og's built-in font rather than the site display font; fine for OG. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          backgroundColor: "#FFF8F0",
        }}
      >
        <svg width="220" height="220" viewBox="0 0 64 64" fill="none">
          <circle cx="45" cy="7" r="2.5" fill="#8C5A3C" />
          <circle cx="51.5" cy="11" r="2" fill="#C08552" />
          <circle cx="47" cy="14.5" r="1.6" fill="#8C5A3C" />
          <rect x="25" y="4" width="14" height="10" rx="4" fill="#4B2E2B" />
          <rect x="28" y="12" width="8" height="7" rx="2.5" fill="#8C5A3C" />
          <rect x="13" y="17" width="38" height="42" rx="15" fill="#C08552" />
          <circle cx="32" cy="38" r="10" fill="#FFF8F0" />
          <path
            d="M32 30.5 L33.9 36.1 L39.5 38 L33.9 39.9 L32 45.5 L30.1 39.9 L24.5 38 L30.1 36.1 Z"
            fill="#4B2E2B"
          />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#4B2E2B",
          }}
        >
          recommendmeafragrance
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#8C5A3C" }}>
          play a game, find your next fragrance
        </div>
      </div>
    ),
    size
  );
}
