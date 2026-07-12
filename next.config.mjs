const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' is required in BOTH environments: the Next.js App
  // Router streams Server Component payloads to the client via inline
  // `<script>self.__next_f.push(...)</script>` tags, and blocking those
  // breaks hydration sitewide (pages render but nothing is interactive).
  // 'unsafe-eval' is dev-only, for Fast Refresh/HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Inline style attributes (animation delays, computed widths/transforms)
  // are used throughout for dynamic, non-user-controlled values, so
  // 'unsafe-inline' stays on for style-src in both environments.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: CSP },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Static catalog/notes/offers JSON in /public/data, rebuilt at deploy
        // time. An hour of fresh caching plus a day of background revalidation
        // keeps repeat game loads fast without risking long-lived staleness.
        source: "/data/:path*.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
