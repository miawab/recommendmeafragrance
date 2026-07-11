import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | recommendmeafragrance",
  description: "What recommendmeafragrance stores, where, and why.",
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

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink-950">
          Privacy Policy
        </h1>
        <p className="text-lg font-medium text-ink-400 mt-2">
          Last updated July 11, 2026. The short version: we store as little as possible, and most
          of your game data never leaves your device.
        </p>
      </div>

      <Section title="What stays on your device">
        <p>
          Your game progress, streaks, daily puzzle history, discovered-fragrance shelf, and game
          preferences are stored in your browser&apos;s local storage. We do not receive this data
          unless you create an account and it syncs (see below). Clearing your browser data
          deletes it.
        </p>
      </Section>

      <Section title="What we store if you sign in">
        <p>
          Accounts are optional and sign-in is via Google. When you sign in we store your Google
          account identifier, your email address, and your first name for display, plus a login
          session identifier and a copy of your game progress so it can follow you across
          devices. We never see your Google password and request no access to your Gmail,
          contacts, or anything beyond basic profile info.
        </p>
        <p>
          Account data lives in a managed Redis database (Upstash). You can stop syncing at any
          time by logging out.
        </p>
      </Section>

      <Section title="The Concierge chat">
        <p>
          Messages you send to the Concierge are forwarded to an AI model provider (Groq, or
          Google if you supply your own Gemini key) to generate a reply. Do not include personal
          information in chat messages. We track daily token usage counters per account to keep
          the shared chat budget fair; the counters reset daily and we do not keep chat
          transcripts.
        </p>
        <p>
          If you optionally add your own Gemini API key, it is stored only in your browser&apos;s
          local storage, sent along with your own chat requests, and used transiently to call
          Google on your behalf. We never store or log it on our servers, and removing it in the
          chat settings deletes it from your browser.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We set two cookies: a login session cookie if you sign in (essential, HTTP-only), and
          an anonymous random identifier used to meter the Concierge&apos;s daily budget. Neither
          tracks you across other websites, and we use no third-party analytics or advertising
          cookies.
        </p>
      </Section>

      <Section title="Affiliate links">
        <p>
          Buy links may go through Commission Junction (CJ), an affiliate network. If you click
          one, CJ may set its own cookies to attribute a purchase, governed by CJ&apos;s privacy
          policy. We may earn a commission at no extra cost to you.
        </p>
      </Section>

      <Section title="Rate limiting">
        <p>
          To protect the service, our servers keep short-lived request counters keyed by IP
          address. They expire automatically within a day and are not used for anything else.
        </p>
      </Section>

      <Section title="Deleting your data">
        <p>
          Local data: clear your browser storage for this site. Account data: contact us at
          ibrahimawab06@gmail.com from any channel and we will delete your account and synced
          progress.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this policy changes, the date at the top changes with it. Material changes will be
          noted on the site.
        </p>
      </Section>
    </div>
  );
}
