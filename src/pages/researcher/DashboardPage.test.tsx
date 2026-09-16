import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "./DashboardPage";
import { AuthContext } from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === "/surveys") {
      return Promise.resolve({
        surveys: [
          {
            id: "study-1",
            title: "Ethiopian Consumer Purchase Patterns",
            status: "active",
            created_at: "2026-08-20T10:00:00Z",
            response_count: 45,
            targeted_count: 100,
          },
          {
            id: "study-2",
            title: "Telebirr Adoption Study",
            status: "pending_review",
            created_at: "2026-08-21T10:00:00Z",
            response_count: 0,
            targeted_count: 100,
          },
          {
            id: "study-3",
            title: "Draft Healthcare Survey",
            status: "wip",
            created_at: "2026-08-22T10:00:00Z",
            response_count: 0,
            targeted_count: 0,
          },
          {
            id: "study-4",
            title: "Finalized Education Feedback",
            status: "final_draft",
            created_at: "2026-08-23T10:00:00Z",
            response_count: 0,
            targeted_count: 0,
          },
          {
            id: "study-5",
            title: "Completed Market Research 2025",
            status: "completed",
            created_at: "2026-08-01T10:00:00Z",
            response_count: 100,
            targeted_count: 100,
          },
        ],
      });
    }
    if (url === "/wallet/researcher") {
      return Promise.resolve({
        wallet: { available_etb: 5000, escrow_etb: 1000 },
      });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderDashboard(userOverride?: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: userOverride ?? {
      id: "res-1",
      full_name: "Test Researcher",
      role: "researcher",
    },
    token: "mock-token",
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("DashboardPage (§4.3.1 Operations Monitor)", () => {
  it("renders 4 status tabs and counts correctly including active and pending_review under Ongoing Studies", async () => {
    renderDashboard();

    expect(await screen.findByText(/Ongoing Studies \(2\)/i)).toBeDefined();
    expect(screen.getByText(/Work-in-Progress \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Final Drafts \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Completed \(1\)/i)).toBeDefined();

    // Verify study titles appear
    expect(screen.getByText("Ethiopian Consumer Purchase Patterns")).toBeDefined();
  });
});
