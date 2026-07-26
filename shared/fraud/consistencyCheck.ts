import type { Question } from "../types.js";

/**
 * Surveys shorter than this get no consistency check: inserting a duplicate into
 * a 3-question survey is conspicuous, and the respondent would notice the repeat.
 */
export const MIN_QUESTIONS_FOR_CHECK = 5;

/** Prefix marking a generated duplicate, so its id can never collide with a real one. */
export const CONSISTENCY_CHECK_PREFIX = "__consistency_";

export function consistencyCheckId(originalId: string): string {
  return `${CONSISTENCY_CHECK_PREFIX}${originalId}`;
}

export function isConsistencyCheckId(questionId: string): boolean {
  return questionId.startsWith(CONSISTENCY_CHECK_PREFIX);
}

/**
 * Picks which question to duplicate.
 *
 * Only choice questions are eligible: two free-text answers to the same question
 * will legitimately differ in wording, so comparing them would produce false
 * positives. Restricted to the first four questions so the duplicate always lands
 * after its original.
 */
export function pickQuestionToDuplicate(
  questions: Question[],
  random: () => number = Math.random,
): Question | null {
  if (questions.length < MIN_QUESTIONS_FOR_CHECK) return null;

  const eligible = questions
    .slice(0, MIN_QUESTIONS_FOR_CHECK - 1)
    .filter((question) => question.type !== "text" && (question.options?.length ?? 0) >= 2);

  if (!eligible.length) return null;

  const index = Math.min(Math.floor(random() * eligible.length), eligible.length - 1);
  return eligible[index] ?? null;
}

/**
 * Builds the duplicate question from the rephrased text.
 *
 * Options are carried over verbatim and in the same order — rephrasing the
 * question must not change what the answers mean, or the comparison would be
 * invalid.
 */
export function buildConsistencyQuestion(original: Question, rephrasedText: string): Question {
  return {
    id: consistencyCheckId(original.id),
    text: rephrasedText,
    type: original.type,
    options: original.options ? [...original.options] : undefined,
    required: true,
    consistencyCheck: { duplicateOf: original.id },
  };
}

/**
 * Insertion index for the duplicate: randomly placed from the fifth question
 * onward, so its position cannot be predicted or gamed.
 */
export function pickInsertIndex(
  questionCount: number,
  random: () => number = Math.random,
): number {
  const earliest = MIN_QUESTIONS_FOR_CHECK - 1;
  if (questionCount <= earliest) return questionCount;

  const slots = questionCount - earliest + 1;
  return earliest + Math.min(Math.floor(random() * slots), slots - 1);
}

/**
 * Compares the duplicate's answer to the original's.
 *
 * A missing answer on either side is not treated as a contradiction — an
 * unanswered question is incomplete, not inconsistent, and speed and
 * completeness are judged by other signals.
 */
export function evaluateConsistency(
  question: Question,
  answers: Record<string, string>,
): boolean | null {
  const originalId = question.consistencyCheck?.duplicateOf;
  if (!originalId) return null;

  const duplicateAnswer = answers[question.id];
  const originalAnswer = answers[originalId];

  if (!duplicateAnswer?.trim() || !originalAnswer?.trim()) return null;

  if (question.type === "multi_choice") {
    return sameSet(originalAnswer, duplicateAnswer);
  }

  return normalize(originalAnswer) === normalize(duplicateAnswer);
}

/** Finds the inserted duplicate, if any, in a question list. */
export function findConsistencyQuestion(questions: Question[]): Question | null {
  return questions.find((question) => question.consistencyCheck) ?? null;
}

/** Multi-choice answers are order-independent, so compare them as sets. */
function sameSet(a: string, b: string): boolean {
  const toSet = (value: string) =>
    new Set(
      value
        .split("|")
        .map((item) => normalize(item))
        .filter(Boolean),
    );

  const left = toSet(a);
  const right = toSet(b);
  if (left.size !== right.size) return false;
  for (const item of left) {
    if (!right.has(item)) return false;
  }
  return true;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
