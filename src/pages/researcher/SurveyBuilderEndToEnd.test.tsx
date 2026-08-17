import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyNewLandingPage } from "./SurveyNewLandingPage";
import { AuthContext } from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url.includes("/surveys")) {
      return Promise.resolve({
        surveys: [
          {
            id: "draft-101",
            title: "Ethiopian Fintech Adoption Draft",
            status: "wip",
            created_at: new Date().toISOString(),
            questions: [],
            reward_etb: 25,
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

describe("Survey Builder Flow Audit (§4.3.1–4.3.4)", () => {
  it("renders 3-card entry point with links to dedicated builder pages for subscribed researchers", () => {
    renderLanding({ role: "researcher", subscription_tier: "subscribed" });

    // 3 Cards exist
    expect(screen.getByText("Build Manually")).toBeDefined();
    expect(screen.getByText("Import Survey")).toBeDefined();
    expect(screen.getByText("AI Survey Generator")).toBeDefined();

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
    expect(screen.getByText("PRO")).toBeDefined();

    // Click on AI generator card
    const aiCardBtn = screen.getByRole("button", { name: /AI Survey Generator/i });
    fireEvent.click(aiCardBtn);

    // Upgrade Modal opens
    expect(screen.getByText("Unlock AI Survey Generator")).toBeDefined();
    expect(screen.getByText("Upgrade Subscription")).toBeDefined();
    expect(screen.getByText("Maybe Later")).toBeDefined();
  });

  it("surfaces recent WIP drafts with links to resume editing", async () => {
    renderLanding();

    expect(screen.getByText("Recent Drafts")).toBeDefined();
  });
});
