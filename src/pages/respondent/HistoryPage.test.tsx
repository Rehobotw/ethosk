import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HistoryPage } from "./HistoryPage";
import { LanguageProvider } from "@/lib/language";

const mockHistoryData = {
  history: [
    {
      id: "resp-demo-1",
      survey_id: "surv-demo-1",
      title: "Understanding Research Participant Recruitment in Ethiopia",
      description: "A study on how Ethiopian respondents discover and engage with academic and market research panels.",
      category: "Market Research",
      reward_etb: 25,
      completed_at: "2026-09-09T14:30:00.000Z",
      time_spent_seconds: 100,
      quality_status: "passed" as const,
      payout_status: "paid" as const,
    },
    {
      id: "resp-demo-2",
      survey_id: "surv-demo-2",
      title: "Healthcare Inclusivity Survey",
      category: "Public Health",
      reward_etb: 35,
      completed_at: "2026-09-10T11:00:00.000Z",
      time_spent_seconds: 180,
      quality_status: "pending" as const,
      payout_status: "pending" as const,
    },
  ],
};

const mockSubmissionDetail = {
  submission: {
    id: "resp-demo-1",
    survey_id: "surv-demo-1",
    survey_title: "Understanding Research Participant Recruitment in Ethiopia",
    description: "A study on how Ethiopian respondents discover and engage with academic and market research panels.",
    reward_etb: 25,
    completed_at: "2026-09-09T14:30:00.000Z",
    total_time_seconds: 100,
    time_per_question: {
      rec_q1: 15,
      rec_q2: 12,
      rec_q3: 28,
      rec_q4: 45,
    },
    quality_status: "passed" as const,
    payout_status: "paid" as const,
    category: "Market Research",
    questions: [
      {
        id: "rec_q1",
        text: "How do you typically discover opportunities to participate in research studies?",
        type: "single_choice" as const,
        options: [
          "University campus boards & announcements",
          "Telegram channels & student groups",
          "Referral from friends or colleagues",
          "Email invitations",
        ],
        required: true,
      },
      {
        id: "rec_sec1",
        text: "Section 2: Payment and Compensation Experience",
        type: "text" as const,
        isSectionHeader: true,
      },
      {
        id: "rec_q2",
        text: "Which digital payment method is most reliable for receiving research rewards?",
        type: "single_choice" as const,
        options: ["Telebirr", "CBE Birr", "Bank Transfer", "Airtime Top-up"],
        required: true,
      },
      {
        id: "rec_q3",
        text: "Which factors are most important to you when deciding to complete an online survey?",
        type: "multi_choice" as const,
        options: [
          "Fair ETB compensation",
          "Instant payout upon completion",
          "Relevance of the research topic",
          "Clear and concise questions",
        ],
        required: true,
      },
      {
        id: "rec_q4",
        text: "What recommendations do you have for researchers to improve the participant experience?",
        type: "text" as const,
        required: true,
      },
    ],
    answers: {
      rec_q1: "Telegram channels & student groups",
      rec_q2: "Telebirr",
      rec_q3: ["Fair ETB compensation", "Instant payout upon completion", "Clear and concise questions"],
      rec_q4: "Ensure questions are localized into Amharic and Afan Oromo, and maintain fast automated payouts through Telebirr.",
    },
  },
};

vi.mock("@/lib/api", () => ({
  api: vi.fn(async (path: string) => {
    if (path === "/respondents/history") {
      return mockHistoryData;
    }
    if (path === "/respondents/history/resp-demo-1") {
      return mockSubmissionDetail;
    }
    throw new Error(`Unhandled api path: ${path}`);
  }),
}));

function renderHistoryPage(initialRoute = "/history") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("HistoryPage - View Submission Summary Feature", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders participation history cards with 'View Submission Summary' button", async () => {
    renderHistoryPage();

    expect(screen.getByRole("heading", { name: "Survey Participation History" })).toBeDefined();

    await waitFor(() => {
      expect(
        screen.getByText("Understanding Research Participant Recruitment in Ethiopia"),
      ).toBeDefined();
    });

    expect(screen.getByText("+25 ETB")).toBeDefined();
    expect(screen.getByRole("button", { name: "View Submission Summary" })).toBeDefined();
  });

  it("opens SubmissionSummaryModal when clicking 'View Submission Summary'", async () => {
    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View Submission Summary" })).toBeDefined();
    });

    const summaryButton = screen.getByRole("button", { name: "View Submission Summary" });
    fireEvent.click(summaryButton);

    // Modal opens and loads details
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Submitted Responses")).toBeDefined();
    });

    // Verify modal content
    expect(screen.getAllByText("Understanding Research Participant Recruitment in Ethiopia").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Section 2: Payment and Compensation Experience")).toBeDefined();

    // Verify answers
    expect(screen.getByText("Telegram channels & student groups")).toBeDefined();
    expect(screen.getAllByText("Your Choice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Ensure questions are localized into Amharic/)).toBeDefined();
  });

  it("closes modal when clicking Close button", async () => {
    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View Submission Summary" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "View Submission Summary" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    const closeBtn = screen.getAllByRole("button", { name: "Close" })[0]!;
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("closes modal on Escape key press", async () => {
    renderHistoryPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "View Submission Summary" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "View Submission Summary" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
