import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminReviewQueuePage } from "./ReviewQueuePage";
import { LanguageProvider } from "@/lib/language";

const mockSurveys = [
  {
    id: "surv-1",
    title: "Global Tech Usage Trends 2024",
    researcher_name: "Dr. Sarah Jenkins",
    organization: "TechInsights Inst.",
    target_audience: "IT Professionals (N=500)",
    budget: 12500,
    created_at: new Date().toISOString(),
    status: "pending",
  },
  {
    id: "surv-2",
    title: "Healthcare Professional Sentiment",
    researcher_name: "Marcus Vance",
    organization: "Health Research Africa",
    target_audience: "Medical Practitioners (N=200)",
    budget: 8000,
    created_at: new Date().toISOString(),
    status: "pending",
  },
];

const mockDocs = [
  {
    id: "doc-1",
    user_id: "user-1",
    doc_type: "student_id",
    ai_notes: null,
    created_at: new Date().toISOString(),
    respondent: {
      full_name: "Abebe Bekele",
      email: "abebe@aau.edu.et",
      verification_tier: "1_id_verified",
    },
    preview_url: "https://example.com/doc1.png",
  },
];

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === "/admin/survey-queue") {
      return Promise.resolve({ items: mockSurveys });
    }
    if (url === "/admin/review-queue") {
      return Promise.resolve({ items: mockDocs });
    }
    return Promise.resolve({ id: "action-success" });
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderReviewQueuePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <AdminReviewQueuePage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Approval Queues (Stitch Screen 6f7ea3340bdd4c5789181436816d783e)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders page header and all 5 queue selector tabs with badge counts", () => {
    renderReviewQueuePage();

    expect(screen.getByText("Approval Queues")).toBeDefined();
    expect(
      screen.getByText("Review and manage pending items requiring administrative clearance."),
    ).toBeDefined();

    // 5 tabs
    expect(screen.getByText("Researcher Approval")).toBeDefined();
    expect(screen.getByText("Respondent Tier 1")).toBeDefined();
    expect(screen.getByText("Respondent Tier 2")).toBeDefined();
    expect(screen.getByText("Survey Approval")).toBeDefined();
    expect(screen.getByText("Compliance Docs")).toBeDefined();
  });

  it("renders survey table rows and opens slide-out review panel with actions", async () => {
    renderReviewQueuePage();

    await waitFor(() => {
      expect(screen.getByText("Global Tech Usage Trends 2024")).toBeDefined();
      expect(screen.getByText("Dr. Sarah Jenkins")).toBeDefined();
      expect(screen.getByText("Healthcare Professional Sentiment")).toBeDefined();
    });

    // Click row to open slide-out detail panel
    const surveyRow = screen.getByText("Global Tech Usage Trends 2024");
    fireEvent.click(surveyRow);

    await waitFor(() => {
      expect(screen.getByText("Review Survey")).toBeDefined();
      expect(screen.getByText("Overview")).toBeDefined();
      expect(screen.getByText("Demographic Filters")).toBeDefined();
      expect(screen.getByText("Content Preview")).toBeDefined();
      expect(screen.getByRole("button", { name: /Approve/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Reject/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Request Correction/i })).toBeDefined();
    });
  });

  it("switches tabs to respondent verification queue", async () => {
    renderReviewQueuePage();

    const t1Tab = screen.getByRole("button", { name: /Respondent Tier 1/i });
    fireEvent.click(t1Tab);

    await waitFor(() => {
      expect(screen.getByText("Abebe Bekele")).toBeDefined();
      expect(screen.getByText("student_id")).toBeDefined();
    });
  });
});
