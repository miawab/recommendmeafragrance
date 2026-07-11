"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_username: "Username must be 3-20 letters, numbers, or underscores.",
  invalid_password: "Password must be at least 8 characters.",
  invalid_credentials: "Wrong username or password.",
  username_taken: "That username's already taken.",
  rate_limited: "Too many attempts, try again in a minute.",
};

function friendlyError(code: string): string {
  return ERROR_MESSAGES[code] ?? "Something went wrong, try again.";
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          Save your streaks and shelf under a username. No email needed.
        </p>
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
