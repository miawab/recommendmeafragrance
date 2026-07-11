import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: the bottle mark on a solid cream tile (Apple
 * disallows transparency and applies its own corner mask). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFF8F0",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
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
      </div>
    ),
    size
  );
}
