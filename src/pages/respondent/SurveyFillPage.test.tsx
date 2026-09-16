import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyFillPage } from "./SurveyFillPage";

const mockApi = vi.fn();

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => mockApi(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "resp-1", role: "respondent", verification_tier: "1_id_verified" },
    refresh: vi.fn(),
  }),
}));

const mockSurvey = {
  id: "survey-test-1",
  title: "Community Perceptions Study",
  description: "A quick community survey",
  target_responses: 100,
  current_responses: 10,
  reward_etb: 45,
  questions: [
    {
      id: "q-1",
      text: "What is your primary source of news?",
      type: "text",
      required: true,
      options: [],
    },
    {
      id: "q-2",
      text: "How often do you use internet services?",
      type: "single_select",
      required: true,
      options: ["Daily", "Weekly", "Rarely"],
    },
  ],
};

function renderSurveyFill() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/surveys/survey-test-1/fill"]}>
        <Routes>
          <Route path="/surveys/:id/fill" element={<SurveyFillPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SurveyFillPage Inline Validation Errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockImplementation((url: string) => {
      if (url.includes("/fill")) {
        return Promise.resolve(mockSurvey);
      }
      return Promise.resolve({});
    });
  });

  it("renders questions and shows inline validation error on missing required question", async () => {
    renderSurveyFill();

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText("What is your primary source of news?")).toBeDefined();
    });

    // Attempt to submit without answering
    const submitButton = screen.getByRole("button", { name: /Submit Response/i });
    fireEvent.click(submitButton);

    // Verify inline error message appears on the question cards
    await waitFor(() => {
      const inlineErrors = screen.getAllByText("This question requires an answer before submitting.");
      expect(inlineErrors.length).toBe(2);
    });

    // Global notice is also shown
    expect(screen.getByText(/Please answer all required questions before submitting/i)).toBeDefined();

    // Now answer the first question
    const textInput = screen.getByPlaceholderText(/Type your answer/i);
    fireEvent.change(textInput, { target: { value: "Radio and Telegram" } });

    // The inline error for q-1 should clear
    await waitFor(() => {
      const remainingErrors = screen.getAllByText("This question requires an answer before submitting.");
      expect(remainingErrors.length).toBe(1);
    });
  });

  it("renders section headers as divider banners and excludes them from required validation", async () => {
    mockApi.mockImplementation((url: string) => {
      if (url.includes("/fill")) {
        return Promise.resolve({
          id: "survey-test-1",
          title: "Understanding Research Participant Recruitment in Ethiopia",
          target_responses: 50,
          current_responses: 5,
          reward_etb: 25,
          questions: [
            {
              id: "sec-1",
              text: "SECTION A — CURRENT RESEARCH EXPERIENCE",
              type: "text",
              required: true,
              options: [],
            },
            {
              id: "q-1",
              text: "What is your primary role in research?",
              type: "text",
              required: true,
              options: [],
            },
          ],
        });
      }
      if (url.includes("/submit")) {
        return Promise.resolve({ reward_etb: 25 });
      }
      return Promise.resolve({});
    });

    renderSurveyFill();

    // Section header is rendered as a Section banner, not an input card
    await waitFor(() => {
      expect(screen.getByText("SECTION A — CURRENT RESEARCH EXPERIENCE")).toBeDefined();
      expect(screen.getByText("Section")).toBeDefined();
    });

    // Answering only the real question (q-1) allows successful submission
    const textInput = screen.getByPlaceholderText(/Type your answer/i);
    fireEvent.change(textInput, { target: { value: "Lead Investigator" } });

    const submitButton = screen.getByRole("button", { name: /Submit Response/i });
    fireEvent.click(submitButton);

    // Verify rich completion screen is rendered with survey title and reward
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Survey Completed Successfully" })).toBeDefined();
      expect(
        screen.getByText(/Understanding Research Participant Recruitment in Ethiopia/i),
      ).toBeDefined();
      expect(screen.getByText("25 ETB")).toBeDefined();
    });
  });
});
