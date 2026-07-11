import Link from "next/link";
import AuthWidget from "@/components/AuthWidget";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="w-full border-b-[3px] border-ink-950/10">
      <div className="max-w-3xl mx-auto px-4 h-20 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-display text-2xl font-extrabold tracking-tight text-ink-950 lowercase"
        >
          recommendmeafragrance
        </Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full font-extrabold lowercase">
            <Link href="/shelf">shelf</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="rounded-full font-extrabold lowercase">
            <Link href="/chat">concierge</Link>
          </Button>
          <AuthWidget />
        </nav>
      </div>
    </header>
  );
}
