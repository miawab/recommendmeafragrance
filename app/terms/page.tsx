import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | recommendmeafragrance",
  description: "The rules for using recommendmeafragrance.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-2xl font-extrabold text-ink-950">{title}</h2>
      <div className="flex flex-col gap-2 text-base font-medium leading-relaxed text-ink-800">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
          Terms of Use
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Last updated July 11, 2026. By using recommendmeafragrance you agree to these terms.
        </p>
      </div>

      <Section title="What this is">
        <p>
          recommendmeafragrance is a free fragrance-discovery site: minigames, a browsable
          catalog, and an AI Concierge. It is provided as-is, without warranties of any kind. We
          may change, pause, or discontinue any feature at any time.
        </p>
      </Section>

      <Section title="Not professional advice">
        <p>
          Fragrance notes, prices, price tiers, and AI-generated recommendations are informational
          and may be inaccurate or out of date. Always check the retailer&apos;s listing before
          buying. The Concierge is an AI and can be wrong.
        </p>
      </Section>

      <Section title="Affiliate disclosure">
        <p>
          Buy links may be affiliate links through Commission Junction. If you purchase through
          them we may earn a commission at no additional cost to you. We do not sell products
          directly and are not responsible for retailer listings, pricing, shipping, or returns.
        </p>
      </Section>

      <Section title="Accounts and acceptable use">
        <p>
          You are responsible for keeping your password private and for activity on your account.
          Do not attempt to abuse, overload, scrape, reverse-engineer, or circumvent the
          service&apos;s limits, or use the Concierge to generate harmful content. We may suspend
          or delete accounts that violate these terms.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect, incidental,
          or consequential damages arising from your use of the site, including purchases made
          through affiliate links.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms: ibrahimawab06@gmail.com.</p>
      </Section>
    </div>
  );
}
