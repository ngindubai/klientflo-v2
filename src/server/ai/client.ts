import Anthropic from "@anthropic-ai/sdk";

/**
 * The most capable Claude model — used for conversation analysis, summarisation,
 * requirement extraction, property matching and replies. Override per-deploy
 * with ANTHROPIC_MODEL if needed.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/** True when an Anthropic API key is configured; otherwise we run on mocks. */
export function isAIEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;

/** Lazily create a shared Anthropic client. Returns null when no key is set. */
export function getAnthropic(): Anthropic | null {
  if (!isAIEnabled()) return null;
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // ANTHROPIC_BASE_URL is honoured automatically when set.
    });
  }
  return client;
}
