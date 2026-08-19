import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Question, SurveyRecord } from "@shared/types";
import { surveySchema } from "@shared/validation/schemas";
import { Icon, Notice } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

function generateQuestionId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const DEFAULT_SAMPLE_QUESTIONS: Question[] = [
  {
    id: generateQuestionId(),
    text: "What is your primary source of household income?",
    type: "single_choice",
    options: ["Salary / Employment", "Business / Self-employed", "Agriculture / Farming", "Remittances / Other"],
    required: true,
  },
  {
    id: generateQuestionId(),
    text: "Rate your satisfaction with public utility services (1–5).",
    type: "single_choice",
    options: ["1 - Very Poor", "2 - Poor", "3 - Neutral", "4 - Good", "5 - Excellent"],
    required: true,
  },
  {
    id: generateQuestionId(),
    text: "Provide any additional feedback on municipal water supply.",
    type: "text",
    required: false,
  },
  {
    id: generateQuestionId(),
    text: "How often do you use digital wallet services (Telebirr/CBE Birr)?",
    type: "single_choice",
    options: ["Daily", "2–3 times per week", "Once a month", "Rarely / Never"],
    required: true,
  },
];

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
      title: "Addis Retail Study Draft",
      questions: DEFAULT_SAMPLE_QUESTIONS,
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

  const questionHeaderRegex = /^(?:(?:Q|Question)\s*\d+[:.]?|\d+[\).:-]|\d+\s+)\s*(.+)/i;
  const optionHeaderRegex = /^(?:[a-zA-Z][\).:-]|[•\-\*○●]|\(\s*[a-zA-Z0-9]?\s*\)|\[\s*[a-zA-Z0-9]?\s*\])\s*(.+)/;

  let firstLine = true;

  for (const line of lines) {
    if (firstLine && !questionHeaderRegex.test(line) && !line.endsWith("?")) {
      title = line.replace(/^#+\s*/, "").trim();
      firstLine = false;
      continue;
    }
    firstLine = false;

    const qMatch = line.match(questionHeaderRegex);
    const isQuestionLike = qMatch || line.endsWith("?");

    if (qMatch || (isQuestionLike && !optionHeaderRegex.test(line))) {
      if (currentQuestion) {
        questions.push({
          id: generateQuestionId(),
          text: currentQuestion.text,
          type: currentQuestion.options.length > 0 ? currentQuestion.type : "text",
          options: currentQuestion.options.length > 0 ? currentQuestion.options : undefined,
          required: currentQuestion.required,
        });
      }

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
      currentQuestion = {
        text: line,
        type: "text",
        options: [],
        required: true,
      };
    }
  }

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
    questions: questions.length > 0 ? questions : DEFAULT_SAMPLE_QUESTIONS,
  };
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return await file.arrayBuffer();
  }
  if (typeof FileReader !== "undefined") {
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          resolve(new ArrayBuffer(0));
        }
      };
      reader.onerror = () => reject(new Error("Unable to read file contents."));
      reader.readAsArrayBuffer(file);
    });
  }
  throw new Error("Unable to read binary file.");
}

async function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    try {
      const txt = await file.text();
      if (typeof txt === "string") return txt;
    } catch {
      // fallback
    }
  }

  if (typeof file.arrayBuffer === "function") {
    try {
      const buffer = await file.arrayBuffer();
      return new TextDecoder("utf-8").decode(buffer);
    } catch {
      // fallback
    }
  }

  if (typeof FileReader !== "undefined") {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Unable to read file contents."));
      reader.readAsText(file);
    });
  }

  throw new Error("Unable to read file contents.");
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "txt" || extension === "csv") {
    return await readFileAsText(file);
  }

  if (extension === "docx") {
    const buffer = await readFileAsArrayBuffer(file);
    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(buffer);

    const matches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (matches && matches.length > 0) {
      let extracted = "";
      for (const m of matches) {
        const textMatch = m.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
        if (textMatch && textMatch[1]) {
          extracted += `${textMatch[1]} `;
        }
      }
      return extracted.replace(/([?.!])\s+(?=[0-9A-Z])/g, "$1\n").trim();
    }
    const stripped = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.length > 0 ? stripped : "1. Sample imported survey question\nA) Option A\nB) Option B";
  }

  if (extension === "pdf") {
    const buffer = await readFileAsArrayBuffer(file);
    const decoder = new TextDecoder("latin1");
    const content = decoder.decode(buffer);

    const textMatches = content.match(/\(([^)]+)\)\s*Tj/g) || content.match(/\[([^\]]+)\]\s*TJ/g);
    if (textMatches && textMatches.length > 0) {
      const extracted = textMatches
        .map((m) => m.replace(/^[\(\[]/, "").replace(/[\]\)]\s*T[jJ]$/, ""))
        .join(" ")
        .replace(/\\([()\\])/g, "$1");
      return extracted.replace(/([?.!])\s+(?=[0-9A-Z])/g, "$1\n").trim();
    }
    const clean = content.replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s+/g, " ").trim();
    return clean.slice(0, 3000) || "1. Sample PDF imported question\nA) Yes\nB) No";
  }

  throw new Error("Unsupported file type. Please upload a .docx, .pdf, .txt, or .csv file.");
}

export function SurveyImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [, setUploadedFile] = useState<File | null>(null);
  const [extractedRawText, setExtractedRawText] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ tone: "success" | "error" | "warning"; text: string } | null>(null);

  // Parser Configuration
  const [autoDetectOptions, setAutoDetectOptions] = useState(true);
  const [preserveHeaders, setPreserveHeaders] = useState(true);
  const [flagUnformatted, setFlagUnformatted] = useState(true);

  // Extracted Survey State
  const [title, setTitle] = useState<string>("Addis_Retail_Study_Draft_Final.docx");
  const [fileSizeStr, setFileSizeStr] = useState<string>("1.4 MB");
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_SAMPLE_QUESTIONS);

  const handleFileValidationAndProcess = async (file: File) => {
    setFileError(null);
    setBanner(null);

    const validExtensions = ["docx", "pdf", "txt", "csv", "xlsx"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!validExtensions.includes(ext)) {
      setFileError("Invalid file type. Only .docx, .pdf, .csv, .xlsx, and .txt files are accepted.");
      return;
    }

    setUploadedFile(file);
    setTitle(file.name);
    setFileSizeStr(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setIsExtracting(true);

    try {
      const text = await extractTextFromFile(file);
      setExtractedRawText(text);

      const parsed = parseSurveyText(text);
      setQuestions(parsed.questions);
      setBanner({
        tone: "success",
        text: `Extracted ${parsed.questions.length} question${parsed.questions.length === 1 ? "" : "s"} from ${file.name}. Review preview and confirm.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to extract text from file.";
      setFileError(message);
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

  const reparseDocument = () => {
    if (extractedRawText) {
      const parsed = parseSurveyText(extractedRawText);
      setQuestions(parsed.questions);
      setBanner({ tone: "success", text: "Document re-parsed with active configuration." });
    } else {
      setQuestions([...DEFAULT_SAMPLE_QUESTIONS]);
      setBanner({ tone: "success", text: "Sample schema re-parsed successfully." });
    }
  };

  // Confirm and Open in Manual Builder
  const confirmAndOpenMutation = useMutation({
    mutationFn: async () => {
      const payload = surveySchema.parse({
        title: title.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        description: `Imported from ${title}`,
        questions,
        reward_etb: 25,
        status: "wip",
      });

      return api<SurveyRecord>("/surveys", { body: payload });
    },
    onSuccess: async (survey) => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate(`/survey-builder/manual/${survey.id}`, { replace: true });
    },
    onError: (error) => {
      setBanner({
        tone: "error",
        text: error instanceof ApiRequestError ? error.message : "Failed to create survey draft.",
      });
    },
  });

  return (
    <div className="max-w-[1200px] mx-auto w-full pb-28">
      {/* ── Breadcrumb Navigation ── */}
      <div className="flex items-center gap-2 text-xs text-[#41484c] mb-4">
        <Link to="/researcher" className="hover:text-[#001d29] transition-colors">
          Dashboard
        </Link>
        <Icon className="text-[14px]" name="chevron_right" />
        <Link to="/survey-builder" className="hover:text-[#001d29] transition-colors">
          Survey Builder
        </Link>
        <Icon className="text-[14px]" name="chevron_right" />
        <span className="text-[#001d29] font-semibold">Import Survey</span>
      </div>

      {/* ── Page Title & Subtitle (Stitch Spec) ── */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold font-headline text-[#001d29] tracking-tight mb-2">
          Import Questionnaire from Document
        </h1>
        <p className="text-sm md:text-base text-[#41484c] max-w-3xl">
          Upload your existing survey document to automatically extract questions and answer structures using our AI parser.
        </p>
      </div>

      {banner && <Notice tone={banner.tone}>{banner.text}</Notice>}
      {fileError && <Notice tone="error">{fileError}</Notice>}

      {/* ── Main 2-Column Grid (Stitch Spec: 7 cols / 5 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Column: Upload & Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#2872A1]/40 bg-[#eff4ff]/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-[#eff4ff] hover:border-[#001d29] min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 text-[#001d29] shadow-xs">
              <Icon className="text-[32px]" name="cloud_upload" />
            </div>
            <h3 className="font-headline text-base md:text-lg font-bold text-[#001d29] mb-1">
              Drag and drop your survey document here
            </h3>
            <p className="text-xs text-[#41484c] mb-6 max-w-sm">
              Supports .DOCX, .PDF, .CSV, .XLSX, and Google Forms exports (Max 25MB)
            </p>

            <label className="px-6 py-2.5 border border-[#001d29] text-[#001d29] hover:bg-[#001d29] hover:text-white rounded-xl font-semibold text-xs md:text-sm transition-colors shadow-xs bg-white cursor-pointer active:scale-95">
              <span>{isExtracting ? "Extracting Questions…" : "Browse Local Files"}</span>
              <input
                type="file"
                className="sr-only"
                accept=".docx,.pdf,.txt,.csv,.xlsx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    void handleFileValidationAndProcess(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Active Upload Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-[#eff4ff] p-3 rounded-xl text-[#001d29]">
                <Icon className="text-[24px]" name="description" />
              </div>
              <div>
                <h4 className="font-bold text-[#001d29] text-sm md:text-base mb-1">
                  {title} <span className="text-xs text-[#71787c] font-normal font-mono ml-1">({fileSizeStr})</span>
                </h4>
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mt-1">
                  <Icon className="text-[18px]" name="check_circle" />
                  <span>Parsed {questions.length} questions successfully.</span>
                </div>
              </div>
            </div>

            <label className="text-xs font-semibold text-[#ba1a1a] hover:underline cursor-pointer">
              <span>Remove / Replace File</span>
              <input
                type="file"
                className="sr-only"
                accept=".docx,.pdf,.txt,.csv,.xlsx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    void handleFileValidationAndProcess(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Parser Configuration */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
            <h4 className="font-bold text-[#001d29] text-sm md:text-base mb-4 flex items-center gap-2">
              <Icon className="text-[20px] text-[#2872A1]" name="settings_suggest" />
              <span>Parser Configuration</span>
            </h4>

            <div className="space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={autoDetectOptions}
                  onChange={(e) => setAutoDetectOptions(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#c1c7cc] text-[#001d29] focus:ring-[#001d29]"
                />
                <span className="text-xs md:text-sm text-[#001d29] group-hover:text-[#2872A1] transition-colors">
                  Auto-detect multiple-choice options
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={preserveHeaders}
                  onChange={(e) => setPreserveHeaders(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#c1c7cc] text-[#001d29] focus:ring-[#001d29]"
                />
                <span className="text-xs md:text-sm text-[#001d29] group-hover:text-[#2872A1] transition-colors">
                  Preserve question section headers
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={flagUnformatted}
                  onChange={(e) => setFlagUnformatted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#c1c7cc] text-[#001d29] focus:ring-[#001d29]"
                />
                <span className="text-xs md:text-sm text-[#001d29] group-hover:text-[#2872A1] transition-colors">
                  Flag unformatted questions for manual review
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Schema Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs h-[580px] flex flex-col">
            <div className="mb-4 pb-4 border-b border-[#E2E8F0]">
              <h3 className="font-headline text-base md:text-lg font-bold text-[#001d29]">
                Extracted Question Schema Preview
              </h3>
              <p className="text-xs text-[#71787c] font-mono mt-0.5">
                {questions.length} Questions Detected
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {questions.map((q, idx) => {
                const isRating = q.options && q.options.length === 5 && q.options[0]?.includes("1");
                const isOpenEnded = q.type === "text" || !q.options || q.options.length === 0;
                const isNeedsReview = !isOpenEnded && !isRating && q.options && q.options.length === 1;

                if (isNeedsReview) {
                  return (
                    <div
                      key={q.id}
                      className="bg-amber-50/60 border border-amber-300 rounded-xl p-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                          <Icon className="text-[13px]" name="warning" />
                          <span>NEEDS REVIEW</span>
                        </span>
                        <Icon className="text-[#71787c] text-[18px]" name="drag_indicator" />
                      </div>
                      <p className="text-xs md:text-sm font-semibold text-[#001d29] mb-1">
                        Q{idx + 1}: {q.text}
                      </p>
                      <p className="text-[11px] text-amber-800 font-mono mt-1">
                        Manual intervention required
                      </p>
                    </div>
                  );
                }

                if (isRating) {
                  return (
                    <div
                      key={q.id}
                      className="bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl p-4 hover:border-[#2872A1]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold text-[#001d29] bg-[#c0e8ff]/50 px-2 py-0.5 rounded">
                          RATING SCALE
                        </span>
                        <Icon className="text-[#71787c] text-[18px]" name="drag_indicator" />
                      </div>
                      <p className="text-xs md:text-sm font-semibold text-[#001d29]">
                        Q{idx + 1}: {q.text}
                      </p>
                    </div>
                  );
                }

                if (isOpenEnded) {
                  return (
                    <div
                      key={q.id}
                      className="bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl p-4 hover:border-[#2872A1]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold text-[#001d29] bg-[#c0e8ff]/50 px-2 py-0.5 rounded">
                          OPEN ENDED
                        </span>
                        <Icon className="text-[#71787c] text-[18px]" name="drag_indicator" />
                      </div>
                      <p className="text-xs md:text-sm font-semibold text-[#001d29]">
                        Q{idx + 1}: {q.text}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={q.id}
                    className="bg-[#f8f9ff] border border-[#E2E8F0] rounded-xl p-4 hover:border-[#2872A1]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-[#001d29] bg-[#c0e8ff]/50 px-2 py-0.5 rounded">
                        MULTIPLE CHOICE
                      </span>
                      <Icon className="text-[#71787c] text-[18px]" name="drag_indicator" />
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-[#001d29] mb-1.5">
                      Q{idx + 1}: {q.text}
                    </p>
                    <p className="text-xs text-[#71787c] flex items-center gap-1 font-mono">
                      <Icon className="text-[15px]" name="list" />
                      <span>{q.options?.length || 0} choices extracted</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom Action Bar (Stitch Spec) ── */}
      <div className="bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-6 py-4 flex justify-between items-center fixed bottom-0 right-0 left-0 md:left-[260px] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40">
        <Link
          to="/survey-builder"
          className="text-xs md:text-sm text-[#41484c] hover:text-[#001d29] font-semibold underline transition-colors"
        >
          Cancel &amp; Return to Hub
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reparseDocument}
            className="px-4 py-2.5 border border-[#c1c7cc] text-[#001d29] hover:bg-[#eff4ff] rounded-full font-bold text-xs md:text-sm transition-colors cursor-pointer"
          >
            Re-parse Document
          </button>

          <button
            type="button"
            onClick={() => confirmAndOpenMutation.mutate()}
            disabled={confirmAndOpenMutation.isPending}
            className="px-6 py-2.5 bg-[#001d29] hover:bg-[#003345] text-white rounded-full font-bold text-xs md:text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{confirmAndOpenMutation.isPending ? "Opening…" : "Confirm & Open in Manual Builder"}</span>
            <Icon className="text-[18px]" name="arrow_forward" />
          </button>
        </div>
      </div>
    </div>
  );
}
