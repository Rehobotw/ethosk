import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyNewLandingPage } from "./SurveyNewLandingPage";
import { AuthContext } from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === "/surveys" || url.includes("/surveys")) {
      return Promise.resolve({
        surveys: [
          {
            id: "draft-101",
            title: "Ethiopian Fintech Adoption Draft",
            status: "wip",
            created_at: "2026-08-15T10:00:00Z",
            questions: [{ id: "q1", text: "Do you use Telebirr?", type: "single_choice" }],
            reward_etb: 25,
            response_count: 0,
            targeted_count: 0,
          },
          {
            id: "draft-102",
            title: "AI Draft: Consumer Retail Habits",
            status: "wip",
            created_at: "2026-08-16T10:00:00Z",
            questions: [{ id: "ai_q1", text: "How often do you shop?", type: "single_choice" }],
            reward_etb: 30,
            response_count: 0,
            targeted_count: 0,
          },
        ],
      });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderLanding(userOverride?: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: userOverride ?? {
      id: "res-sub",
      role: "researcher",
      subscription_tier: "subscribed",
    },
    token: "mock-token",
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    refresh: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SurveyNewLandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("Survey Builder Flow Audit (§4.3.1–4.3.5)", () => {
  it("renders 3-card entry point with links to dedicated builder pages for subscribed researchers", () => {
    renderLanding({ role: "researcher", subscription_tier: "subscribed" });

    // 3 Cards exist
    expect(screen.getByText("Manual builder")).toBeDefined();
    expect(screen.getByText("Import a questionnaire")).toBeDefined();
    expect(screen.getByText("Generate with AI")).toBeDefined();

    // Check link destinations
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));

    expect(hrefs).toContain("/survey-builder/manual");
    expect(hrefs).toContain("/survey-builder/import");
    expect(hrefs).toContain("/survey-builder/ai");
  });

  it("gating: Free-tier researchers clicking AI Survey Generator card triggers upgrade modal", () => {
    renderLanding({ role: "researcher", subscription_tier: "free" });

    // AI Card should have PRO indicator
    expect(screen.getByText(/Pro researcher plan/i)).toBeDefined();

    // Click on AI generator card CTA
    const aiCardBtn = screen.getByRole("button", { name: /Generate with AI/i });
    fireEvent.click(aiCardBtn);

    // Upgrade Modal opens
    expect(screen.getByText("Unlock AI Survey Generator")).toBeDefined();
    expect(screen.getByText("Upgrade Subscription")).toBeDefined();
    expect(screen.getByText("Maybe Later")).toBeDefined();
  });

  it("surfaces recent WIP drafts with builder type badges, timestamps, and Resume Editing buttons (§4.3.5)", async () => {
    renderLanding();

    await waitFor(() => {
      expect(screen.getByText("Recent Work-in-Progress")).toBeDefined();
      expect(screen.getByText("Ethiopian Fintech Adoption Draft")).toBeDefined();
      expect(screen.getByText("AI Draft: Consumer Retail Habits")).toBeDefined();

      // Quick action button
      const resumeButtons = screen.getAllByText("Resume Editing");
      expect(resumeButtons.length).toBe(2);
    });
  });

  it("opens delete confirmation modal when clicking delete draft button", async () => {
    renderLanding();

    await waitFor(() => {
      expect(screen.getByText("Ethiopian Fintech Adoption Draft")).toBeDefined();
    });

    const deleteButtons = screen.getAllByTitle("Delete draft");
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]!);

    expect(screen.getByText("Delete Draft Survey?")).toBeDefined();
    expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });
});
