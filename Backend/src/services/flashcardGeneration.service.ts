import {
  anthropic,
  REASONING_PARAMS,
  extractText,
} from "../config/anthropic";
import { logger } from "../utils/logger";

/**
 * Claude-drafted revision cards — PRICING_SPEC-adjacent, but really the fuel for
 * the flashcard gap signal in gapDetection.service.
 *
 * Everything produced here is a DRAFT. The caller persists with
 * `isVerified: false` and a tutor approves card by card. An AI card with a
 * wrong "correct" answer teaches the mistake and then costs the student marks
 * in the exam, so nothing generated is ever served directly.
 */

export interface DraftCard {
  front: string;
  back: string;
  tags: string[];
}

/** Hard ceiling regardless of what the caller asks for. */
const MAX_CARDS = 25;

/** Below this there is not enough lesson to draft anything worthwhile. */
const MIN_SOURCE_CHARS = 120;

export class NotEnoughContentError extends Error {
  constructor() {
    super(
      "This lesson has too little text to generate cards from. Add lesson notes first, or write the cards by hand."
    );
    this.name = "NotEnoughContentError";
  }
}

function buildPrompt(opts: {
  lessonTitle: string;
  courseTitle: string;
  subjectName?: string | null;
  content: string;
  count: number;
}): string {
  const { lessonTitle, courseTitle, subjectName, content, count } = opts;

  return `You are helping a Nigerian secondary-school teacher prepare revision flashcards for their own lesson.

Subject: ${subjectName ?? "General"}
Course: ${courseTitle}
Lesson: ${lessonTitle}

LESSON MATERIAL:
"""
${content}
"""

Write up to ${count} flashcards drawn ONLY from the material above.

Rules:
- Every card must be answerable from the material. Do not introduce outside facts.
- Front: one specific question. Not "Discuss X" — something with a definite answer.
- Back: the complete answer in 1–2 sentences. A student should be able to mark themselves right or wrong without ambiguity.
- Favour what an examiner asks: definitions, laws, formulae, causes, differences, worked steps.
- Skip anything trivial ("What is the title of this lesson?") and anything the material only mentions in passing.
- Use the vocabulary of the WAEC/NECO syllabus where it applies.
- If the material genuinely does not support ${count} good cards, return fewer. Quality over count.

Return ONLY a JSON array, no prose and no markdown fence:
[
  {"front": "…", "back": "…", "tags": ["topic keyword"]}
]`;
}

/**
 * Returns drafts, or an empty array when the model produced nothing usable.
 * Throws NotEnoughContentError when the lesson itself is too thin to try.
 */
export async function generateFlashcardDrafts(opts: {
  lessonTitle: string;
  courseTitle: string;
  subjectName?: string | null;
  content: string;
  count?: number;
}): Promise<DraftCard[]> {
  const content = (opts.content ?? "").trim();
  if (content.length < MIN_SOURCE_CHARS) throw new NotEnoughContentError();

  const count = Math.min(Math.max(opts.count ?? 15, 1), MAX_CARDS);

  const response = await anthropic.messages.create({
    ...REASONING_PARAMS,
    // Shared with adaptive thinking. ~60 tokens a card plus reasoning headroom.
    max_tokens: 8000,
    messages: [{ role: "user", content: buildPrompt({ ...opts, content, count }) }],
  });

  const text = extractText(response);
  if (!text) {
    logger.warn("Flashcard generation returned no text block");
    return [];
  }

  // Models sometimes fence the JSON despite being told not to.
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    logger.warn({ sample: cleaned.slice(0, 200) }, "Flashcard generation: no JSON array found");
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    logger.warn({ err }, "Flashcard generation: JSON parse failed");
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  // Validate every card rather than trusting the shape. A malformed entry is
  // dropped, not persisted half-formed.
  const drafts: DraftCard[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") continue;
    const { front, back, tags } = raw as Record<string, unknown>;
    if (typeof front !== "string" || typeof back !== "string") continue;

    const f = front.trim();
    const b = back.trim();
    if (!f || !b) continue;
    // Guard against a runaway generation filling a card with an essay.
    if (f.length > 500 || b.length > 1500) continue;

    drafts.push({
      front: f,
      back: b,
      tags: Array.isArray(tags)
        ? tags.filter((t): t is string => typeof t === "string").slice(0, 5)
        : [],
    });

    if (drafts.length >= count) break;
  }

  logger.info(
    { returned: Array.isArray(parsed) ? parsed.length : 0, kept: drafts.length },
    "Flashcard drafts generated"
  );
  return drafts;
}
