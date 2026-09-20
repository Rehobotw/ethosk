import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionPage } from "./SubscriptionPage";
import { ChooseSubscriptionPlanPage } from "./ChooseSubscriptionPlanPage";

let mockUser: any = {
  id: "usr-1",
  email: "researcher@aau.edu.et",
  role: "researcher",
  subscription_tier: "free",
  subscription_expires_at: null,
};

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock("@/lib/language", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockResolvedValue({}),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Dynamic Renewal Date & Free Tier State (REH-139)", () => {
  it("renders 'Renewal: Never expires' on SubscriptionPage for free-tier users", () => {
    mockUser = {
      id: "usr-free",
      email: "free@aau.edu.et",
      role: "researcher",
      subscription_tier: "free",
      subscription_expires_at: null,
    };

    renderWithClient(<SubscriptionPage />);
    const badge = screen.getByTestId("subscription-renewal-date");
    expect(badge.textContent).toContain("Never expires");
    expect(screen.queryByText(/Sep 01, 2026/i)).toBeNull();
  });

  it("renders formatted dynamic expiration date on SubscriptionPage for subscribed users", () => {
    mockUser = {
      id: "usr-pro",
      email: "pro@aau.edu.et",
      role: "researcher",
      subscription_tier: "subscribed",
      subscription_expires_at: "2026-12-15T00:00:00Z",
    };

    renderWithClient(<SubscriptionPage />);
    const badge = screen.getByTestId("subscription-renewal-date");
    expect(badge.textContent).toMatch(/Dec 15, 2026/);
    expect(screen.queryByText(/Sep 01, 2026/i)).toBeNull();
  });

  it("renders 'Renewal: Never expires' on ChooseSubscriptionPlanPage for free-tier users", () => {
    mockUser = {
      id: "usr-free",
      email: "free@aau.edu.et",
      role: "researcher",
      subscription_tier: "free",
      subscription_expires_at: null,
    };

    renderWithClient(<ChooseSubscriptionPlanPage />);
    const badge = screen.getByTestId("plan-renewal-badge");
    expect(badge.textContent).toContain("Never expires");
    expect(screen.queryByText(/Oct 15, 2024/i)).toBeNull();
  });

  it("renders dynamic renewal date on ChooseSubscriptionPlanPage for subscribed users", () => {
    mockUser = {
      id: "usr-pro",
      email: "pro@aau.edu.et",
      role: "researcher",
      subscription_tier: "subscribed",
      subscription_expires_at: "2026-11-20T00:00:00Z",
    };

    renderWithClient(<ChooseSubscriptionPlanPage />);
    const badge = screen.getByTestId("plan-renewal-badge");
    expect(badge.textContent).toMatch(/Nov 20, 2026/);
    expect(screen.queryByText(/Oct 15, 2024/i)).toBeNull();
  });
});
