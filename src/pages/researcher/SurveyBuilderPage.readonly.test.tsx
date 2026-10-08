import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyBuilderPage } from "./SurveyBuilderPage";
import { AuthContext } from "@/lib/auth";
import * as apiModule from "@/lib/api";

// REH-126: Test suite for active and submitted survey read-only locking in UI

function renderBuilderForSurvey(surveyId: string, initialSurvey: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  vi.spyOn(apiModule, "api").mockImplementation(async (path: string) => {
    if (path === `/surveys/${surveyId}`) {
      return initialSurvey;
    }
    if (path === "/wallet/researcher") {
      return { wallet: { available_etb: 10000 } };
    }
    return {} as any;
  });

  const authValue: any = {
    user: {
      id: "user-1",
      full_name: "Test Researcher",
      email: "researcher@ethosk.com",
      role: "researcher",
      verification_tier: "tier_1",
      subscription_tier: "free",
    },
    token: "mock-token",
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    updateUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/survey-builder/manual/${surveyId}`]}>
          <Routes>
            <Route path="/survey-builder/manual/:id" element={<SurveyBuilderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("SurveyBuilderPage Read-Only Protection (REH-126)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks UI and displays prominent read-only banner when survey is active", async () => {
    const activeSurvey = {
      id: "survey-active-1",
      title: "National Telecommunications Study",
      description: "Evaluating national connectivity",
      status: "active",
      reward_etb: 25,
      questions: [
        {
          id: "q1",
          text: "How often do you use mobile banking?",
          type: "single_choice",
          options: ["Daily", "Weekly", "Monthly"],
          required: true,
        },
      ],
      created_at: new Date().toISOString(),
    };

    renderBuilderForSurvey("survey-active-1", activeSurvey);

    // Banner check
    const banner = await screen.findByTestId("survey-readonly-banner");
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain("Survey is Active (Read-Only)");
    expect(banner.textContent).toContain("This survey cannot be edited because it is active");

    // Title input disabled
    const titleInput = screen.getByPlaceholderText("Survey Title") as HTMLInputElement;
    expect(titleInput.disabled).toBe(true);

    // Save & Proceed button replaced by View Analytics
    expect(screen.queryByText("Save & Proceed to Posting")).toBeNull();
    expect(screen.getAllByText("View Analytics").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Locked · Read-Only Mode")).toBeDefined();

    // Question input disabled
    const questionInput = screen.getByPlaceholderText("Question title") as HTMLTextAreaElement;
    expect(questionInput.disabled).toBe(true);

    // Options disabled
    const optionInput = screen.getByPlaceholderText("Option 1") as HTMLInputElement;
    expect(optionInput.disabled).toBe(true);

    // Add New Question Block button should be absent
    expect(screen.queryByText("Add New Question Block")).toBeNull();
  });

  it("locks UI when survey is in_review", async () => {
    const inReviewSurvey = {
      id: "survey-review-1",
      title: "Public Health Assessment",
      description: "Evaluating regional clinics",
      status: "in_review",
      reward_etb: 30,
      questions: [
        {
          id: "q1",
          text: "Clinic visit frequency",
          type: "single_choice",
          options: ["Once a year", "Multiple times"],
          required: true,
        },
      ],
      created_at: new Date().toISOString(),
    };

    renderBuilderForSurvey("survey-review-1", inReviewSurvey);

    const banner = await screen.findByTestId("survey-readonly-banner");
    expect(banner.textContent).toContain("Under Admin Review (Read-Only)");
    expect(screen.queryByText("Save & Proceed to Posting")).toBeNull();
  });

  it("allows full editing when survey is a draft or wip", async () => {
    const draftSurvey = {
      id: "survey-draft-1",
      title: "Draft Consumer Study",
      description: "Work in progress",
      status: "draft",
      reward_etb: 15,
      questions: [
        {
          id: "q1",
          text: "What brands do you purchase?",
          type: "single_choice",
          options: ["Brand A", "Brand B"],
          required: true,
        },
      ],
      created_at: new Date().toISOString(),
    };

    renderBuilderForSurvey("survey-draft-1", draftSurvey);

    // Banner should NOT be present
    expect(screen.queryByTestId("survey-readonly-banner")).toBeNull();

    // Title should be editable
    const titleInput = await screen.findByPlaceholderText("Survey Title") as HTMLInputElement;
    expect(titleInput.disabled).toBe(false);

    // Action buttons should be present
    expect(screen.getByText("Save & Proceed to Posting")).toBeDefined();
    expect(screen.getByText("Add New Question Block")).toBeDefined();
  });
});
