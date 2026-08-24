import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../utils/logger";

// Validate API key exists
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  logger.warn("ANTHROPIC_API_KEY not set in environment variables");
}

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey,
});

/**
 * The model every AI feature runs on — single source of truth.
 *
 * Override per-environment with ANTHROPIC_MODEL. The string is complete as
 * written: do NOT append a date suffix.
 */
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

/**
 * Preset for short, bounded generations — one-line insights, JSON payloads.
 *
 * `thinking` is explicitly disabled. On Claude Sonnet 5 adaptive thinking is
 * ON by default, and max_tokens caps thinking *plus* the response together —
 * so a 200-token budget would be spent reasoning and return empty text.
 * These call sites want the answer, not the reasoning.
 */
export const FAST_PARAMS = {
  model: CLAUDE_MODEL,
  thinking: { type: "disabled" },
  output_config: { effort: "low" },
} as const satisfies Partial<Anthropic.MessageCreateParams>;

/**
 * Preset for analysis where the reasoning *is* the deliverable — currently
 * the tutor gap briefs. Adaptive thinking is left on; callers using this must
 * budget max_tokens for thinking as well as output.
 */
export const REASONING_PARAMS = {
  model: CLAUDE_MODEL,
  thinking: { type: "adaptive" },
  output_config: { effort: "medium" },
} as const satisfies Partial<Anthropic.MessageCreateParams>;

/**
 * Extract the assistant's text from a response.
 *
 * Never index `content[0]` directly: when thinking is enabled the first block
 * is a `thinking` block, not text, so positional access silently yields
 * nothing. This scans for the first text block instead, which is correct under
 * every preset.
 *
 * @returns the text, or `null` if the response carried none.
 */
export function extractText(message: Anthropic.Message): string | null {
  for (const block of message.content) {
    if (block.type === "text") return block.text;
  }
  return null;
}

logger.debug({ model: CLAUDE_MODEL }, "Anthropic client initialized");
