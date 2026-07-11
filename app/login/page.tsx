"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_username: "Username must be 3-20 letters, numbers, or underscores.",
  invalid_password: "Password must be at least 8 characters.",
  invalid_credentials: "Wrong username or password.",
  username_taken: "That username's already taken.",
  rate_limited: "Too many attempts, try again in a minute.",
  google_failed: "Google sign-in didn't go through, try again.",
  google_unconfigured: "Google sign-in isn't set up yet, use a username instead.",
};

function friendlyError(code: string): string {
  return ERROR_MESSAGES[code] ?? "Something went wrong, try again.";
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Failed OAuth round-trips land back here as /login?error=google_*.
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) setError(friendlyError(code));
  }, []);

  async function submit(mode: "login" | "signup") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(friendlyError(data.error ?? "unknown"));
        return;
      }
      // Full reload (not client-side router.push) so AuthWidget remounts and
      // picks up the new session cookie via its own fetch on mount.
      window.location.href = "/";
    } catch {
      setError("Couldn't reach the server, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-7">
      <div>
        <h1 className="font-display text-4xl font-extrabold text-ink-950">Welcome</h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Sign in to save your streaks and shelf, and to chat with the Concierge.
        </p>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full gap-3">
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

      <div className="flex items-center gap-3 text-sm font-bold text-ink-400">
        <span className="h-px flex-1 bg-ink-950/10" />
        or use a username, no email needed
        <span className="h-px flex-1 bg-ink-950/10" />
      </div>

      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-cream-200 p-1 h-14">
          <TabsTrigger
            value="login"
            className="rounded-full font-extrabold data-[state=active]:bg-ink-950 data-[state=active]:text-cream-100"
          >
            Log in
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-full font-extrabold data-[state=active]:bg-ink-950 data-[state=active]:text-cream-100"
          >
            Sign up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit("login");
            }}
          >
            <Input
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-base font-bold text-ink-950">{error}</p>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit("signup");
            }}
          >
            <Input
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password (min 8 characters)"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-base font-bold text-ink-950">{error}</p>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
