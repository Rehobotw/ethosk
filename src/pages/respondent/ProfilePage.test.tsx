import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfilePage } from "./ProfilePage";
import { AuthContext } from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url.includes("/wallet")) {
      return Promise.resolve({
        wallet: { available_etb: 250, lifetime_etb: 1500 },
        payouts: [
          {
            id: "p1",
            survey_title: "National Digital Literacy Study",
            amount_etb: 50,
            status: "paid",
            created_at: new Date().toISOString(),
          },
        ],
      });
    }
    if (url.includes("/profile")) {
      return Promise.resolve({
        user_id: "resp-123",
        age: 25,
        gender: "female",
        region: "Addis Ababa",
        city: "Bole",
        employment_status: "employed_full_time",
        attributes: {
          survey_alerts: true,
          data_consent: true,
        },
      });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderProfileWithUser(userOverride?: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: userOverride ?? {
      id: "resp-123",
      user_id: "resp-123",
      full_name: "Almaz Ayana",
      email: "almaz@example.com",
      role: "respondent",
      verification_tier: "1_id_verified",
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
          <ProfilePage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("ProfilePage (§3.3 Respondent Profile Page Rebuild)", () => {
  it("renders all four core sections", async () => {
    renderProfileWithUser();

    // Section 1: Account Identity & Security
    expect(screen.getByText(/1\. Account Identity & Security/i)).toBeDefined();
    expect(screen.getByText("Almaz Ayana")).toBeDefined();
    expect(screen.getByDisplayValue("almaz@example.com")).toBeDefined();
    expect(screen.getByText("Change Login Password")).toBeDefined();

    // Section 2: Core Demographics
    expect(screen.getByText(/2\. Core Demographics/i)).toBeDefined();
    expect(screen.getByText("Targeting Profile Completion")).toBeDefined();
    expect(screen.getByText("Verify Demographics")).toBeDefined();

    // Section 3: Earnings & Redemption (after wallet query resolves)
    await waitFor(() => {
      expect(screen.getByText(/3\. Earnings & Redemption/i)).toBeDefined();
      expect(screen.getByText("Redeem Rewards")).toBeDefined();
      expect(screen.getByText("National Digital Literacy Study")).toBeDefined();
    });

    // Section 4: Essential Privacy Controls
    expect(screen.getByText(/4\. Essential Privacy Controls/i)).toBeDefined();
    expect(screen.getByText("Data Processing & Privacy Consent")).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete Account" })).toBeDefined();
  });

  it("links to verification flow", () => {
    renderProfileWithUser();

    const verifyLinks = screen.getAllByRole("link").filter((l) =>
      l.getAttribute("href")?.includes("/verification"),
    );
    expect(verifyLinks.length).toBeGreaterThan(0);
  });
});
