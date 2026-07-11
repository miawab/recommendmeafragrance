"use client";

export type FunnelEvent =
  | "game_start"
  | "game_complete"
  | "card_view"
  | "cj_click"
  | "chat_message"
  | "chat_locked";

export function track(event: FunnelEvent, payload: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  try {
    // Lightweight funnel logger. Vercel Analytics covers pageviews/vitals separately;
    // this just gives us a console-visible, greppable event stream for the funnel.
    // eslint-disable-next-line no-console
    console.log(`[rmf:event] ${event}`, payload);
    window.dispatchEvent(new CustomEvent("rmf:analytics", { detail: { event, payload } }));
  } catch {
    // analytics must never break the app
  }
}
