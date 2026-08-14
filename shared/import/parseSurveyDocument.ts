import type { Question, QuestionType } from "../types.js";

export interface ParsedSurvey {
  title?: string;
  questions: Question[];
}

const QUESTION_PREFIX_REGEX = /^(?:(?:Q(?:uestion)?\s*\d+[\.:\)]?)|(?:\d+[\.:]))\s*(.*)$/i;
const OPTION_PREFIX_REGEX =
  /^(?:(?:[a-zA-Z][\.\)])|(?:\([a-zA-Z\d]\))|(?:\d+\))|(?:-\s*\[[ xX]?\])|(?:[\*\-•]))\s*(.*)$/;
const MULTI_CHOICE_INDICATOR = /(?:select\s+all|choose\s+all|check\s+all|all\s+that\s+apply)/i;

/**
 * Parses raw text from a document (.txt, .docx, .pdf) into structured survey questions.
 */
export function parseSurveyText(rawText: string): ParsedSurvey {
  if (!rawText || !rawText.trim()) {
    return { questions: [] };
  }

  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let title: string | undefined = undefined;
  const questions: Question[] = [];

  let currentQuestion: {
    text: string;
    options: string[];
    isMulti: boolean;
  } | null = null;

  let lineIdx = 0;

  // Check if first line is a title
  const firstLine = lines[0];
  if (firstLine) {
    const isFirstLineQuestion = QUESTION_PREFIX_REGEX.test(firstLine);
    const isFirstLineOption = OPTION_PREFIX_REGEX.test(firstLine);
    if (!isFirstLineQuestion && !isFirstLineOption) {
      title = firstLine.replace(/^(?:Title|Survey Title|Topic):\s*/i, "").trim();
      lineIdx = 1;
    }
  }

  function finalizeQuestion() {
    if (!currentQuestion || !currentQuestion.text.trim()) return;

    let qType: QuestionType = "text";
    if (currentQuestion.options.length > 0) {
      qType = currentQuestion.isMulti ? "multi_choice" : "single_choice";
    }

    questions.push({
      id: `q_${questions.length + 1}`,
      text: currentQuestion.text.trim(),
      type: qType,
      options: currentQuestion.options.length > 0 ? currentQuestion.options : undefined,
      required: true,
    });

    currentQuestion = null;
  }

  for (; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!line) continue;

    // Check option match first if a question is already open
    if (currentQuestion) {
      const optionMatch = line.match(OPTION_PREFIX_REGEX);
      if (optionMatch) {
        const optionText = (optionMatch[1] ?? "").trim();
        if (optionText) {
          currentQuestion.options.push(optionText);
          if (/\[\s*\]/.test(line)) {
            currentQuestion.isMulti = true;
          }
        }
        continue;
      }
    }

    const questionMatch = line.match(QUESTION_PREFIX_REGEX);
    if (questionMatch) {
      finalizeQuestion();

      const qText = (questionMatch[1] ?? "").trim();
      currentQuestion = {
        text: qText,
        options: [],
        isMulti: MULTI_CHOICE_INDICATOR.test(qText) || /\[\s*\]/i.test(line),
      };
      continue;
    }

    // Option match when no question is active (e.g. standalone unnumbered question with bullets)
    const optionMatch = line.match(OPTION_PREFIX_REGEX);
    if (optionMatch && currentQuestion) {
      const optionText = (optionMatch[1] ?? "").trim();
      if (optionText) {
        currentQuestion.options.push(optionText);
      }
      continue;
    }

    // Unmarked lines: either continuation of question text, continuation of option, or new question
    if (currentQuestion) {
      if (currentQuestion.options.length === 0) {
        currentQuestion.text += " " + line;
        if (MULTI_CHOICE_INDICATOR.test(line)) {
          currentQuestion.isMulti = true;
        }
      } else {
        const lastIdx = currentQuestion.options.length - 1;
        const prevOpt = currentQuestion.options[lastIdx];
        if (prevOpt !== undefined) {
          currentQuestion.options[lastIdx] = prevOpt + " " + line;
        }
      }
    } else {
      finalizeQuestion();
      currentQuestion = {
        text: line,
        options: [],
        isMulti: MULTI_CHOICE_INDICATOR.test(line),
      };
    }
  }

  finalizeQuestion();

  return {
    title,
    questions,
  };
}
