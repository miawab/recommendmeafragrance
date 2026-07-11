"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const ERROR_MESSAGES: Record<string, string> = {
  google_failed: "Google sign-in didn't go through, try again.",
  google_unconfigured: "Google sign-in isn't set up yet, check back soon.",
};

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Failed OAuth round-trips land back here as /login?error=google_*.
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) setError(ERROR_MESSAGES[code] ?? "Something went wrong, try again.");
  }, []);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-7 text-center">
      <Logo className="h-20 w-20" />
      <div>
        <h1 className="font-display text-4xl font-extrabold text-ink-950">Welcome</h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Sign in with Google to save your streaks and shelf across devices, and to chat with the
          Concierge.
        </p>
      </div>

      <Button asChild size="lg" className="w-full gap-3">
        <a href="/api/auth/google">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.3c1.9-1.8 3-4.4 3-7.5Z M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z M6.4 14a6 6 0 0 1 0-3.9V7.5H3a10 10 0 0 0 0 9L6.4 14Z M12 6c1.5 0 2.8.5 3.8 1.5L18.7 4.6A10 10 0 0 0 3 7.5L6.4 10C7.2 7.7 9.4 6 12 6Z"
            />
          </svg>
          Continue with Google
        </a>
      </Button>

      {error && <p className="text-base font-bold text-ink-950">{error}</p>}

      <p className="text-sm font-medium text-ink-400">
        We only receive your email and first name, never your password, and we never touch your
        Gmail or contacts.
      </p>
    </div>
  );
}
