import Link from "next/link";
import AuthWidget from "@/components/AuthWidget";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="w-full border-b-[3px] border-ink-950/10">
      <div className="max-w-3xl mx-auto flex h-16 items-center justify-between gap-2 px-4 sm:h-20 sm:gap-3">
        {/* min-w-0 + truncate (not a fixed size) is what keeps this from ever
            pushing the nav off-screen on narrow phones, regardless of exact
            viewport width. */}
        <Link
          href="/"
          className="min-w-0 flex-1 truncate font-display text-lg font-extrabold tracking-tight text-ink-950 lowercase sm:text-2xl"
        >
          recommendmeafragrance
        </Link>

        {/* Desktop: full inline nav with labeled buttons. Mobile: a single
            hamburger menu instead, three separate icon pills plus the auth
            widget was too crowded next to the logo on narrow screens. */}
        <nav className="hidden shrink-0 items-center gap-3 sm:flex">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-4 font-extrabold lowercase">
            <Link href="/shelf">shelf</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="rounded-full px-4 font-extrabold lowercase">
            <Link href="/chat">concierge</Link>
          </Button>
          <AuthWidget />
        </nav>

        <div className="shrink-0 sm:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
