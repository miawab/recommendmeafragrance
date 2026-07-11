"use client";

import Link from "next/link";
import { LogIn, LogOut, Menu, Sparkles, Trophy, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/useAuth";

/** Single hamburger menu for narrow screens, replacing what would otherwise
 * be 3+ separate icon buttons (shelf, concierge, auth) crowding the header
 * next to the truncating logo. Desktop keeps the full inline nav instead. */
export default function MobileNav() {
  const { username, logout } = useAuth();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Menu"
          className="tap-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-950 hover:bg-ink-950/8 transition-colors"
        >
          <Menu className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <nav className="flex flex-col">
          <Link
            href="/shelf"
            className="tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-ink-950 hover:bg-ink-950/8 transition-colors"
          >
            <Trophy className="h-5 w-5 text-ink-400" strokeWidth={2.5} />
            Shelf
          </Link>
          <Link
            href="/chat"
            className="tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-ink-950 hover:bg-ink-950/8 transition-colors"
          >
            <Sparkles className="h-5 w-5 text-ink-400" strokeWidth={2.5} />
            Concierge
          </Link>

          <div className="my-1.5 h-px bg-ink-950/10" />

          {username === undefined && <div className="mx-3 my-2 h-6 w-24 rounded-full bg-cream-200 animate-pulse" />}

          {username === null && (
            <Link
              href="/login"
              className="tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-ink-950 hover:bg-ink-950/8 transition-colors"
            >
              <LogIn className="h-5 w-5 text-ink-400" strokeWidth={2.5} />
              Log in
            </Link>
          )}

          {username != null && (
            <>
              <div className="flex items-center gap-3 px-3 py-2.5 text-base font-bold text-ink-950">
                <User className="h-5 w-5 text-ink-400" strokeWidth={2.5} />
                <span className="truncate">{username}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-ink-950 hover:bg-ink-950/8 transition-colors"
              >
                <LogOut className="h-5 w-5 text-ink-400" strokeWidth={2.5} />
                Log out
              </button>
            </>
          )}
        </nav>
      </PopoverContent>
    </Popover>
  );
}
