import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionPage } from "./SubscriptionPage";

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: {
      id: "usr-1",
      email: "dr.bekele@addis.edu.et",
      role: "researcher",
      subscription_tier: "subscribed",
      subscription_expires_at: "2026-09-01T00:00:00Z",
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockResolvedValue({}),
  ApiRequestError: class ApiRequestError extends Error {},
}));

describe("SubscriptionPage (Stitch Subscription & Plan Management)", () => {
  it("renders active plan card, 3 plan tiers and billing history table", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Subscription & Plan Management")).toBeDefined();
    expect(screen.getByText("Active Plan: Pro Researcher")).toBeDefined();
    expect(screen.getByText("Available Plans")).toBeDefined();
    expect(screen.getByText("Basic")).toBeDefined();
    expect(screen.getByText("Pro Researcher")).toBeDefined();
    expect(screen.getByText("Enterprise")).toBeDefined();
    expect(screen.getByText("Subscription Billing History")).toBeDefined();
    expect(screen.getAllByText("Pro Monthly Plan").length).toBeGreaterThan(0);
  });

  it("opens cancel subscription modal when clicking Cancel / Pause Subscription", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const cancelBtn = screen.getByText("Cancel / Pause Subscription");
    fireEvent.click(cancelBtn);

    expect(screen.getByText("Pause or Cancel Subscription?")).toBeDefined();
  });
});
