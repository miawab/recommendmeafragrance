"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";

/** Desktop-only (rendered inside SiteHeader's `hidden sm:flex` nav). Mobile
 * gets the same auth actions inside MobileNav's menu instead, there's no
 * room in the mobile header for a standalone widget. */
export default function AuthWidget() {
  const { username, logout } = useAuth();

  if (username === undefined) {
    return <div className="h-9 w-20 shrink-0 rounded-full bg-cream-200 animate-pulse" />;
  }

  if (username === null) {
    return (
      <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-full px-4 font-extrabold lowercase">
        <Link href="/login">log in</Link>
      </Button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5 text-sm font-extrabold text-ink-950"
        title={username}
      >
        <User className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        <span className="max-w-[8ch] truncate">{username}</span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Log out"
        className="rounded-full px-4 font-extrabold lowercase"
        onClick={logout}
      >
        log out
      </Button>
    </div>
  );
}
