import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatMode } from "./ChatMode";
import type { Question } from "@shared/types";

const mockApi = vi.fn();

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => mockApi(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

const mockQuestions: Question[] = [
  {
    id: "sec-a",
    text: "SECTION A — CURRENT RESEARCH EXPERIENCE",
    type: "text",
    required: true,
  },
  {
    id: "q-1",
    text: "What is your primary research role?",
    type: "single_choice",
    options: ["Academic Researcher", "Student", "Industry Professional"],
    required: true,
  },
  {
    id: "q-2",
    text: "Describe your biggest recruitment challenge.",
    type: "text",
    required: true,
  },
];

function renderChatMode(onFinish = vi.fn(), onFallback = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ChatMode
        surveyId="test-survey-1"
        title="Understanding Research Participant Recruitment in Ethiopia"
        questions={mockQuestions}
        onFinish={onFinish}
        onFallback={onFallback}
      />
    </QueryClientProvider>,
  );
}

describe("ChatMode Section Headers & Question Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("advances past section headers, formats markdown headers with bookmark badge, and shows quick-reply chips for the real question", async () => {
    mockApi.mockResolvedValueOnce({
      reply: "Welcome! Let's begin the survey.\n\n**SECTION A — CURRENT RESEARCH EXPERIENCE**\n\nQuestion 1 of 2: What is your primary research role?",
      fallback_to_form: false,
      question_index: 1,
      question_type: "single_choice",
      options: ["Academic Researcher", "Student", "Industry Professional"],
      is_followup: false,
      is_complete: false,
      total_questions: 2,
    });

    renderChatMode();

    // Verify section header rendered with badge
    await waitFor(() => {
      expect(screen.getByText("SECTION A — CURRENT RESEARCH EXPERIENCE")).toBeDefined();
      expect(screen.getAllByText(/What is your primary research role\?/i).length).toBeGreaterThanOrEqual(1);
    });

    // Quick-reply options for q-1 are rendered
    expect(screen.getByRole("button", { name: "Academic Researcher" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Student" })).toBeDefined();

    // Active question indicator at the bottom shows Q1 (excluding section header count)
    expect(screen.getByText("Q1:")).toBeDefined();
    expect(screen.getByText("What is your primary research role?")).toBeDefined();

    // Progress bar displays Question 1 of 2 (ignoring section header in total count)
    expect(screen.getByText("Question 1 of 2")).toBeDefined();
  });

  it("submits responses and automatically fills section headers with [section_header]", async () => {
    const onFinish = vi.fn();

    // Turn 1: Welcome & Q1
    mockApi.mockResolvedValueOnce({
      reply: "Welcome! What is your primary research role?",
      fallback_to_form: false,
      question_index: 1,
      question_type: "single_choice",
      options: ["Academic Researcher", "Student"],
      is_followup: false,
      is_complete: false,
      total_questions: 2,
    });

    renderChatMode(onFinish);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Academic Researcher" })).toBeDefined();
    });

    // Turn 2: Answer Q1, server responds with Q2
    mockApi.mockResolvedValueOnce({
      reply: "Great! Describe your biggest recruitment challenge.",
      fallback_to_form: false,
      question_index: 2,
      question_type: "text",
      options: null,
      is_followup: false,
      is_complete: false,
      total_questions: 2,
    });

    fireEvent.click(screen.getByRole("button", { name: "Academic Researcher" }));

    await waitFor(() => {
      expect(screen.getByText("Great! Describe your biggest recruitment challenge.")).toBeDefined();
    });

    // Turn 3: Answer Q2, server marks survey complete
    mockApi.mockResolvedValueOnce({
      reply: "Thank you for completing the survey!",
      fallback_to_form: false,
      question_index: null,
      question_type: null,
      options: null,
      is_followup: false,
      is_complete: true,
      total_questions: 2,
    });

    const input = screen.getByPlaceholderText(/Type your answer/i);
    fireEvent.change(input, { target: { value: "Finding verified participants in rural areas" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Review & submit button appears
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Review and Submit Response/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /Review and Submit Response/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    const [answers, timings] = onFinish.mock.calls[0]!;

    // Section header is automatically marked with [section_header]
    expect(answers["sec-a"]).toBe("[section_header]");
    expect(answers["q-1"]).toBe("Academic Researcher");
    expect(answers["q-2"]).toBe("Finding verified participants in rural areas");
    expect(timings.total_time_seconds).toBeGreaterThanOrEqual(0);
  });
});
