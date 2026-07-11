import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t-[3px] border-ink-950/10 py-8 text-center text-sm font-medium text-ink-400">
      <div className="max-w-3xl mx-auto flex flex-col gap-3 px-4">
        <p>
          We may earn a commission on purchases made through buy links here. It supports the site
          and costs you nothing extra.
        </p>
        <nav className="flex items-center justify-center gap-4 font-bold">
          <Link href="/privacy" className="hover:text-ink-950 transition-colors">
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-ink-950 transition-colors">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
