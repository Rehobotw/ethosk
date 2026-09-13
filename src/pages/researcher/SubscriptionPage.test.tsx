import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionPage } from "./SubscriptionPage";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "usr-1",
      email: "dr.bekele@addis.edu.et",
      role: "researcher",
      subscription_tier: "subscribed",
      subscription_expires_at: "2026-09-01T00:00:00Z",
    },
  })),
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

  it("calls DELETE /wallet/researcher/subscription when confirming cancellation", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("Cancel / Pause Subscription"));
    const confirmBtn = screen.getByTestId("confirm-cancel-subscription-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith("/wallet/researcher/subscription", { method: "DELETE" });
    });
  });

  it("renders scheduled cancellation banner when subscription_tier is cancelled", async () => {
    (useAuth as any).mockReturnValue({
      user: {
        id: "usr-1",
        email: "dr.bekele@addis.edu.et",
        role: "researcher",
        subscription_tier: "cancelled",
        subscription_expires_at: "2026-09-01T00:00:00Z",
      },
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SubscriptionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("subscription-cancelled-banner")).toBeDefined();
    expect(screen.getByText("Subscription Cancellation Scheduled")).toBeDefined();
  });
});


