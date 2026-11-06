import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyAnalyticsPage } from "./SurveyAnalyticsPage";
import { AuthContext } from "@/lib/auth";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn(),
  };
});

function renderAnalyticsPage(surveyId = "survey-zero-1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: {
      id: "res-1",
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
        <MemoryRouter initialEntries={[`/surveys/${surveyId}/analytics`]}>
          <Routes>
            <Route path="/surveys/:id/analytics" element={<SurveyAnalyticsPage />} />
            <Route path="/surveys" element={<SurveyAnalyticsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("SurveyAnalyticsPage (REH-122: Zero-Response Analytics)", () => {
  it("renders 0%, N/A, 0m 0s and empty chart states when survey has zero responses", async () => {
    vi.mocked(apiModule.api).mockImplementation((url: string) => {
      if (url === "/surveys") {
        return Promise.resolve({
          surveys: [
            {
              id: "survey-zero-1",
              title: "New Fresh Study",
              status: "active",
              response_count: 0,
              targeted_count: 100,
            },
          ],
        });
      }
      if (url.includes("/analytics")) {
        return Promise.resolve({
          response_count: 0,
          targeted_count: 100,
          clean_count: 0,
          completion_rate: 0,
          distributions: {},
        });
      }
      if (url.includes("/responses")) {
        return Promise.resolve({
          responses: [],
          total: 0,
        });
      }
      return Promise.resolve({});
    });

    renderAnalyticsPage();

    await waitFor(() => {
      expect(screen.getByText("New Fresh Study")).toBeDefined();
    });

    // Zero-safe KPIs
    expect(screen.getByText("0%")).toBeDefined();
    expect(screen.getByText("0m 0s")).toBeDefined();
    expect(screen.getByText("N/A")).toBeDefined();

    // Verify empty state messages instead of hardcoded mock numbers
    expect(screen.getByText("No demographic data yet")).toBeDefined();
    expect(screen.getByText("No regional data yet")).toBeDefined();
    expect(screen.getByText("No education data yet")).toBeDefined();
    expect(screen.getByText("No velocity data yet")).toBeDefined();

    // Verify mock fallbacks are NOT displayed
    expect(screen.queryByText("99.1%")).toBeNull();
    expect(screen.queryByText("Addis Ababa")).toBeNull();
  });
});
