"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthWidget() {
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { username: string | null }) => setUsername(data.username))
      .catch(() => setUsername(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsername(null);
    router.push("/");
    router.refresh();
  }

  if (username === undefined) {
    return <div className="h-9 w-20 rounded-full bg-cream-200 animate-pulse" />;
  }

  if (username === null) {
    return (
      <Button asChild variant="ghost" size="sm" className="rounded-full font-extrabold lowercase">
        <Link href="/login">log in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5 text-sm font-extrabold text-ink-950">
        <User className="h-4 w-4" strokeWidth={2.5} />
        {username}
      </span>
      <Button variant="ghost" size="sm" className="rounded-full font-extrabold lowercase" onClick={logout}>
        log out
      </Button>
    </div>
  );
}
