export type ChatState = "NORMAL" | "WRAPUP" | "LOCKED";

export const MAX_MESSAGES_PER_DAY = 20;
export const WRAPUP_THRESHOLD = 0.75;

/**
 * messageNumber is the 1-indexed count of the message about to be sent
 * (including this one), so passing 20 means this is the 20th message.
 */
export function getChatState(
  usageTokens: number,
  dailyBudget: number,
  messageNumber: number
): ChatState {
  if (dailyBudget <= 0 || usageTokens >= dailyBudget) return "LOCKED";
  const usedPct = usageTokens / dailyBudget;
  if (usedPct >= WRAPUP_THRESHOLD || messageNumber >= MAX_MESSAGES_PER_DAY) return "WRAPUP";
  return "NORMAL";
}

export function remainingBudgetPct(usageTokens: number, dailyBudget: number): number {
  if (dailyBudget <= 0) return 0;
  return Math.max(0, Math.round(((dailyBudget - usageTokens) / dailyBudget) * 100));
}

export function stripUrls(text: string): string {
  return text.replace(/\bhttps?:\/\/\S+/gi, "").replace(/\bwww\.\S+/gi, "");
}
