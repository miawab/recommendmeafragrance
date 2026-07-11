"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pullAndMergeProgress } from "./syncClient";

/** Shared auth-state hook so the desktop nav and mobile menu don't each fire
 * their own /api/auth/me request and duplicate the login/logout logic. */
export function useAuth() {
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { username: string | null }) => {
        setUsername(data.username);
        // Logged in: merge any progress saved from other devices into this
        // one (guarded internally to run once per page load).
        if (data.username) pullAndMergeProgress();
      })
      .catch(() => setUsername(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsername(null);
    router.push("/");
    router.refresh();
  }

  return { username, logout };
}
