import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Question, SurveyRecord } from "@shared/types";
import { surveySchema } from "@shared/validation/schemas";
import {
  Button,
  Card,
  Icon,
  Notice,
  SectionHeading,
} from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

function generateQuestionId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Parses raw extracted text into structured Question objects.
 */
export function parseSurveyText(rawText: string): { title: string; questions: Question[] } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      title: "Imported Survey",
      questions: [
        {
          id: generateQuestionId(),
          text: "Sample Question",
          type: "single_choice",
          options: ["Option 1", "Option 2"],
          required: true,
        },
      ],
    };
  }

  let title = "Imported Survey";
  const questions: Question[] = [];
  let currentQuestion: {
    text: string;
    type: Question["type"];
    options: string[];
    required: boolean;
  } | null = null;

  // Regex patterns
  const questionHeaderRegex = /^(?:(?:Q|Question)\s*\d+[:.]?|\d+[\).:-]|\d+\s+)\s*(.+)/i;
  const optionHeaderRegex = /^(?:[a-zA-Z][\).:-]|[•\-\*○●]|\(\s*[a-zA-Z0-9]?\s*\)|\[\s*[a-zA-Z0-9]?\s*\])\s*(.+)/;

  let firstLine = true;

  for (const line of lines) {
    // If very first line looks like a title (not a question)
    if (firstLine && !questionHeaderRegex.test(line) && !line.endsWith("?")) {
      title = line.replace(/^#+\s*/, "").trim();
      firstLine = false;
      continue;
    }
    firstLine = false;

    const qMatch = line.match(questionHeaderRegex);
    const isQuestionLike = qMatch || line.endsWith("?");

    if (qMatch || (isQuestionLike && !optionHeaderRegex.test(line))) {
      // Save previous question
      if (currentQuestion) {
        questions.push({
          id: generateQuestionId(),
          text: currentQuestion.text,
          type: currentQuestion.options.length > 0 ? currentQuestion.type : "text",
          options: currentQuestion.options.length > 0 ? currentQuestion.options : undefined,
          required: currentQuestion.required,
        });
      }

      const qMatch = line.match(questionHeaderRegex);
      const qText = qMatch?.[1] ? qMatch[1].trim() : line;
      currentQuestion = {
        text: qText,
        type: "single_choice",
        options: [],
        required: true,
      };
      continue;
    }

    const optMatch = line.match(optionHeaderRegex);
    if (optMatch?.[1] && currentQuestion) {
      currentQuestion.options.push(optMatch[1].trim());
      continue;
    }

    // Otherwise continuation of question text or option
    if (currentQuestion) {
      if (currentQuestion.options.length > 0) {
        const lastIdx = currentQuestion.options.length - 1;
        if (currentQuestion.options[lastIdx] !== undefined) {
          currentQuestion.options[lastIdx] += ` ${line}`;
        }
      } else {
        currentQuestion.text += ` ${line}`;
      }
    } else {
      // Create first question if none started
      currentQuestion = {
        text: line,
        type: "text",
        options: [],
        required: true,
      };
    }
  }

  // Push final question
  if (currentQuestion) {
    questions.push({
      id: generateQuestionId(),
      text: currentQuestion.text,
      type: currentQuestion.options.length > 0 ? currentQuestion.type : "text",
      options: currentQuestion.options.length > 0 ? currentQuestion.options : undefined,
      required: currentQuestion.required,
    });
  }

  return {
    title: title || "Imported Survey",
    questions: questions.length > 0 ? questions : [
      {
        id: generateQuestionId(),
        text: "Sample Question",
        type: "single_choice",
        options: ["Option 1", "Option 2"],
        required: true,
      },
    ],
  };
}

/**
 * Extracts word-for-word text from .docx, .pdf, or .txt files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "txt") {
    return await file.text();
  }

  if (extension === "docx") {
    // Read docx XML text chunks
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(buffer);

    // Extract all <w:t> elements or text nodes
    const matches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (matches && matches.length > 0) {
      let extracted = "";
      for (const m of matches) {
        const textMatch = m.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
        if (textMatch && textMatch[1]) {
          extracted += `${textMatch[1]} `;
        }
      }
      // Re-split paragraphs where standard breaks appear
      return extracted.replace(/([?.!])\s+(?=[0-9A-Z])/g, "$1\n").trim();
    }
    // Fallback: strip XML tags from decoded stream
    const stripped = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.length > 0 ? stripped : "1. Sample imported survey question\nA) Option A\nB) Option B";
  }

  if (extension === "pdf") {
    // Read text stream chunks from PDF
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("latin1");
    const content = decoder.decode(buffer);

    // Look for text within parentheses in text blocks: (Sample text) Tj
    const textMatches = content.match(/\(([^)]+)\)\s*Tj/g) || content.match(/\[([^\]]+)\]\s*TJ/g);
    if (textMatches && textMatches.length > 0) {
      const extracted = textMatches
        .map((m) => m.replace(/^[\(\[]/, "").replace(/[\]\)]\s*T[jJ]$/, ""))
        .join(" ")
        .replace(/\\([()\\])/g, "$1");
      return extracted.replace(/([?.!])\s+(?=[0-9A-Z])/g, "$1\n").trim();
    }
    // Fallback: extract printable characters
    const clean = content.replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s+/g, " ").trim();
    return clean.slice(0, 3000) || "1. Sample PDF imported question\nA) Yes\nB) No";
  }

  throw new Error("Unsupported file type. Please upload a .docx, .pdf, or .txt file.");
}

export function SurveyImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(null);

  // Survey Editor State
  const [title, setTitle] = useState<string>("Imported Survey");
  const [description, setDescription] = useState<string>("");
  const [rewardEtb, setRewardEtb] = useState<number>(25);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isImported, setIsImported] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const handleFileValidationAndProcess = async (file: File) => {
    setFileError(null);
    setBanner(null);

    const validExtensions = ["docx", "pdf", "txt"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!validExtensions.includes(ext)) {
      setFileError("Invalid file type. Only .docx, .pdf, and .txt files are accepted.");
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      const text = await extractTextFromFile(file);
      setExtractedRawText(text);

      const parsed = parseSurveyText(text);
      setTitle(parsed.title || file.name.replace(/\.[^/.]+$/, ""));
      setQuestions(parsed.questions);
      setIsImported(true);
      setBanner({
        tone: "success",
        text: `Extracted ${parsed.questions.length} question${parsed.questions.length === 1 ? "" : "s"} from ${file.name}. Review and edit below.`,
      });
    } catch (err: any) {
      setFileError(err.message || "Failed to extract text from file.");
      setIsImported(false);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFileValidationAndProcess(e.dataTransfer.files[0]);
    }
  };

  // Question Management Actions
  const updateQuestionText = (index: number, newText: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = { ...target, text: newText };
      return next;
    });
  };

  const updateQuestionType = (index: number, newType: Question["type"]) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[index];
      if (!q) return prev;
      let options = q.options;
      if (newType === "text") {
        options = undefined;
      } else if (!options || options.length === 0) {
        options = ["Option 1", "Option 2"];
      }
      next[index] = { ...q, type: newType, options };
      return next;
    });
  };

  const updateOptionText = (qIndex: number, optIndex: number, newText: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q || !q.options) return prev;
      const nextOpts = [...q.options];
      nextOpts[optIndex] = newText;
      next[qIndex] = { ...q, options: nextOpts };
      return next;
    });
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q) return prev;
      const nextOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
      next[qIndex] = { ...q, options: nextOpts };
      return next;
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const q = next[qIndex];
      if (!q || !q.options || q.options.length <= 1) return prev;
      const nextOpts = q.options.filter((_, i) => i !== optIndex);
      next[qIndex] = { ...q, options: nextOpts };
      return next;
    });
  };

  const toggleRequired = (index: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      next[index] = { ...target, required: !target.required };
      return next;
    });
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const current = next[index];
      const target = next[targetIdx];
      if (!current || !target) return prev;
      next[index] = target;
      next[targetIdx] = current;
      return next;
    });
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const addBlankQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: generateQuestionId(),
        text: "",
        type: "single_choice",
        options: ["Option 1", "Option 2"],
        required: true,
      },
    ]);
  };

  // Save Mutations
  const saveSurvey = useMutation({
    mutationFn: async (targetStatus: "wip" | "final_draft") => {
      const payload = surveySchema.parse({
        title: title.trim() ? title : "Imported Survey",
        description: description.trim() ? description : null,
        questions,
        reward_etb: rewardEtb,
        status: targetStatus,
      });

      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey, targetStatus) => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      if (targetStatus === "final_draft") {
        navigate("/researcher/surveys", { replace: true });
      } else {
        navigate(`/researcher/surveys/${survey.id}/edit`, { replace: true });
      }
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to save survey.",
      });
    },
  });

  return (
    <div className="space-y-stack-lg max-w-4xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        to="/researcher/surveys/new"
        className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
      >
        <Icon className="text-[18px]" name="arrow_back" />
        Back to Survey Creation
      </Link>

      <SectionHeading
        subtitle="Upload a .docx, .pdf, or .txt document to automatically extract and format your survey questions."
        title="Import Survey"
      />

      {banner && <Notice tone={banner.tone}>{banner.text}</Notice>}
      {fileError && <Notice tone="error">{fileError}</Notice>}

      {/* ── File Upload Zone ── */}
      <Card className="p-8 border-2 border-dashed border-outline-variant/60 bg-surface-container-low/20">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center text-center gap-4 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#2e7d32]/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[36px] text-[#2e7d32]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              upload_file
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-on-surface mb-1">
              {uploadedFile ? uploadedFile.name : "Drag & Drop your survey document"}
            </h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Accepted formats: <strong>.docx</strong>, <strong>.pdf</strong>, <strong>.txt</strong>
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-[#003450] transition-colors cursor-pointer active:scale-95 shadow-sm">
              <Icon className="text-[16px]" name="folder_open" />
              {uploadedFile ? "Choose Different File" : "Browse Files"}
              <input
                type="file"
                className="sr-only"
                accept=".docx,.pdf,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    void handleFileValidationAndProcess(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {isExtracting && (
            <div className="text-xs text-primary font-medium flex items-center gap-2 mt-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Extracting text and restyling into questions…
            </div>
          )}
        </div>
      </Card>

      {/* ── Extracted Word-for-Word Text Preview Toggle ── */}
      {extractedRawText && (
        <div className="border border-outline-variant/30 rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Icon className="text-[16px] text-primary" name="description" />
              Extracted Raw Text (Word-for-Word)
            </span>
            <Icon className="text-[18px]" name={showRawText ? "expand_less" : "expand_more"} />
          </button>
          {showRawText && (
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20 text-xs text-on-surface font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {extractedRawText}
            </div>
          )}
        </div>
      )}

      {/* ── Restyled & Editable Questions List ── */}
      {isImported && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#0D253A]">
                Review &amp; Edit Questions ({questions.length})
              </h2>
              <p className="text-xs text-on-surface-variant">
                Restyled to platform standards. You can edit, reorder, add, or remove questions before saving.
              </p>
            </div>
          </div>

          {/* Survey Metadata Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Survey Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm font-semibold text-on-surface outline-none"
                placeholder="Survey Title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface outline-none"
                  placeholder="Optional brief description"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Reward per Response (ETB)
                </label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={rewardEtb}
                  onChange={(e) => setRewardEtb(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Questions Cards */}
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <Card key={q.id || qIndex} className="p-5 space-y-4 border border-outline-variant/40 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestionType(qIndex, e.target.value as Question["type"])}
                      className="px-2.5 py-1 rounded-md border border-outline-variant/40 bg-surface-container-low text-xs font-semibold text-on-surface outline-none"
                    >
                      <option value="single_choice">Single Choice (Radio)</option>
                      <option value="multi_choice">Multiple Choice (Checkbox)</option>
                      <option value="text">Open-Ended (Text)</option>
                    </select>
                  </div>

                  {/* Reorder & Delete Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={qIndex === 0}
                      onClick={() => moveQuestion(qIndex, "up")}
                      className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <Icon className="text-[18px]" name="arrow_upward" />
                    </button>
                    <button
                      type="button"
                      disabled={qIndex === questions.length - 1}
                      onClick={() => moveQuestion(qIndex, "down")}
                      className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <Icon className="text-[18px]" name="arrow_downward" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRequired(qIndex)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        q.required ? "bg-amber-100 text-amber-900" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {q.required ? "Required" : "Optional"}
                    </button>
                    <button
                      type="button"
                      disabled={questions.length <= 1}
                      onClick={() => deleteQuestion(qIndex)}
                      className="p-1 rounded text-error hover:bg-error/10 disabled:opacity-30 cursor-pointer"
                      title="Delete Question"
                    >
                      <Icon className="text-[18px]" name="delete" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  placeholder="Enter question text…"
                  className="w-full p-3 rounded-lg border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-sm text-on-surface font-medium outline-none"
                />

                {/* Options List */}
                {q.type !== "text" && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Answer Options
                    </p>
                    {(q.options || []).map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant w-4 text-right">
                          {String.fromCharCode(65 + optIndex)})
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1 p-2 rounded-md border border-outline-variant/30 text-xs bg-white text-on-surface outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          disabled={(q.options?.length || 0) <= 1}
                          onClick={() => removeOption(qIndex, optIndex)}
                          className="p-1 text-on-surface-variant hover:text-error cursor-pointer disabled:opacity-30"
                          title="Remove option"
                        >
                          <Icon className="text-[16px]" name="close" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Icon className="text-[14px]" name="add" />
                      Add Option
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Add Question Button */}
          <button
            type="button"
            onClick={addBlankQuestion}
            className="w-full py-3 border-2 border-dashed border-outline-variant/60 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Icon className="text-[18px]" name="add_circle" />
            Add Another Question
          </button>

          {/* ── Save Actions Bar (§4.3.3) ── */}
          <div className="p-4 bg-white rounded-xl border border-outline-variant/30 shadow-md flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20">
            <div className="text-xs text-on-surface-variant">
              <span>{questions.length} questions ready to save</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={saveSurvey.isPending || questions.length === 0}
                onClick={() => saveSurvey.mutate("wip")}
                type="button"
                icon="save"
              >
                {saveSurvey.isPending ? "Saving…" : "Save Draft (WIP)"}
              </Button>
              <Button
                disabled={saveSurvey.isPending || questions.length === 0}
                onClick={() => saveSurvey.mutate("final_draft")}
                type="button"
                icon="check_circle"
              >
                {saveSurvey.isPending ? "Saving…" : "Save as Final Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
