import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyQueuePage } from "./SurveyQueuePage";
import { LanguageProvider } from "@/lib/language";

const mockSurveyQueue = {
  items: [
    {
      id: "srv-201",
      title: "Addis Ababa Health Clinic Patient Experience Survey",
      researcher: { full_name: "Dr. Aster Bekele", email: "aster@aau.edu.et" },
      research_category: "medical_health",
      compliance_required: true,
      compliance_rule_triggered: "IRB / Ethics Committee Clearance",
      compliance_answer: true,
      sample_size: 250,
      budget: 15000,
      created_at: new Date().toISOString(),
      preview_url: "https://example.com/irb_clearance.pdf",
      status: "pending",
      priority: "High",
    },
  ],
};

const apiMock = vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
  if (url === "/admin/survey-queue") {
    return Promise.resolve(mockSurveyQueue);
  }
  if (url.startsWith("/admin/survey-queue/")) {
    return Promise.resolve({ id: "srv-201", status: opts?.body?.decision });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderSurveyQueuePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <SurveyQueuePage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Survey Approval Queue with 4-Point Document Review (Stitch Screen 8b6cdee78c394f2ea173352001715754)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, metrics bento cards and pending surveys in table", async () => {
    renderSurveyQueuePage();

    expect(screen.getByRole("heading", { name: "Survey Review Queue", level: 1 })).toBeDefined();
    expect(screen.getByText("Manage and evaluate pending ethical clearance surveys.")).toBeDefined();

    // 4 Metrics Bento Cards
    expect(screen.getAllByText("Pending Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Under Review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Needs Correction").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Resubmitted").length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(screen.getByText("Addis Ababa Health Clinic Patient Experience Survey")).toBeDefined();
      expect(screen.getByText("Dr. Aster Bekele")).toBeDefined();
    });
  });

  it("opens inspection drawer with 4-point review checklist and executes structured approval", async () => {
    renderSurveyQueuePage();

    await waitFor(() => {
      expect(screen.getByText("Addis Ababa Health Clinic Patient Experience Survey")).toBeDefined();
    });

    // Click Review button on the row to expand the 4-point review drawer
    const reviewBtn = screen.getByRole("button", { name: /Review/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText("1. Relevance")).toBeDefined();
      expect(screen.getByText("2. Apparent Authenticity")).toBeDefined();
      expect(screen.getByText("3. Study-Category Alignment")).toBeDefined();
      expect(screen.getByText("4. Completeness & Expiry")).toBeDefined();
    });

    // Click Check All
    const checkAllBtn = screen.getByRole("button", { name: /Check All/i });
    fireEvent.click(checkAllBtn);

    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    const submitBtn = screen.getByRole("button", { name: /Submit Approval/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-201",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "passed",
            checklist: {
              relevance: true,
              apparent_authenticity: true,
              category_alignment: true,
              completeness_expiry: true,
            },
          }),
        }),
      );
    });
  });
});
