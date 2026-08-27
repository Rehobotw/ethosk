import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyPostingWizardPage } from "../researcher/SurveyPostingWizardPage";
import { SurveyFillPage } from "../respondent/SurveyFillPage";
import { LanguageProvider } from "@/lib/language";

const mockSurveys = [
  {
    id: "survey-101",
    title: "National Consumer Retail Trends 2026",
    status: "draft",
    reward_etb: 50,
    created_at: new Date().toISOString(),
    questions: [
      { id: "q1", text: "How often do you shop at supermarkets?", type: "single_choice", options: ["Daily", "Weekly", "Rarely"] },
    ],
  },
];

const mockFillSurvey = {
  id: "survey-101",
  title: "National Consumer Retail Trends 2026",
  questions: [
    { id: "q1", text: "How often do you shop at supermarkets?", type: "single_choice", options: ["Daily", "Weekly", "Rarely"] },
  ],
  reward_etb: 50,
};

const apiMock = vi.fn().mockImplementation((url: string, _opts?: { body?: Record<string, unknown> }) => {
  if (url === "/surveys" || url === "/surveys?status=draft") {
    return Promise.resolve({ surveys: mockSurveys });
  }
  if (url === "/surveys/compliance-rules") {
    return Promise.resolve({ rules: [] });
  }
  if (url.includes("/fill")) {
    return Promise.resolve(mockFillSurvey);
  }
  if (url.includes("/match")) {
    return Promise.resolve({ matched_count: 1200 });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "respondent", full_name: "Abebe Kebede", email: "abebe@gmail.com" },
    refresh: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
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
          {ui}
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Voice Survey End-to-End Gating (Spec v3/v4 §7.4 Open Item #8)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("gates off Voice Survey option in Survey Posting Wizard with Coming Soon badge and disabled state", async () => {
    renderWithProviders(<SurveyPostingWizardPage />);

    await waitFor(() => {
      expect(screen.getByText("National Consumer Retail Trends 2026")).toBeDefined();
    });

    // Select survey and advance to Step 2 (Select Format)
    const draftRow = screen.getByText("National Consumer Retail Trends 2026");
    fireEvent.click(draftRow);

    const nextStepBtn = screen.getByRole("button", { name: /Next Step/i });
    fireEvent.click(nextStepBtn);

    await waitFor(() => {
      expect(screen.getByText("Select Survey Format")).toBeDefined();
      expect(screen.getByText("Voice Survey")).toBeDefined();
      expect(screen.getByText("Coming Soon")).toBeDefined();
    });

    // Voice card is disabled / coming soon and standard web form is selected by default
    expect(screen.getByText(/Qualitative depth through automated voice-guided interviews/i)).toBeDefined();
  });

  it("gates off Voice Mode on Respondent Survey Fill Page", async () => {
    renderWithProviders(<SurveyFillPage />);

    await waitFor(() => {
      expect(screen.getByText("National Consumer Retail Trends 2026")).toBeDefined();
    });

    // Verify Voice button is disabled with 'Coming Soon'
    const voiceButton = screen.getByRole("button", { name: /Voice \(Coming Soon\)/i });
    expect(voiceButton).toBeDefined();
    expect(voiceButton.hasAttribute("disabled")).toBe(true);
  });
});
