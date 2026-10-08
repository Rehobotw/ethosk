import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionPage } from "./SubscriptionPage";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-1",
      role: "researcher",
      subscription_tier: "subscribed",
      subscription_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
  })),
}));

const mockApi = vi.fn();
vi.mock("@/lib/api", () => ({
  api: vi.fn((...args: unknown[]) => mockApi(...args)),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderSubscriptionPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SubscriptionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── REH-138 Tests ──────────────────────────────────────────────────────────
describe("SubscriptionPage – billing history (REH-138)", () => {
  beforeEach(() => {
    mockApi.mockResolvedValue({ history: [] });
  });

  it("shows empty state when no billing records", async () => {
    mockApi.mockResolvedValue({ history: [] });
    renderSubscriptionPage();
    await waitFor(() => {
      expect(screen.getByText(/no billing records yet/i)).toBeTruthy();
    });
  });

  it("renders real billing rows from API", async () => {
    mockApi.mockResolvedValue({
      history: [
        {
          id: "chg-1",
          date: "Sep 01, 2026",
          plan: "Pro Monthly Plan",
          amountEtb: 500,
          paymentMethod: "wallet",
        },
      ],
    });
    renderSubscriptionPage();
    await waitFor(() => {
      expect(screen.getAllByText(/pro monthly plan/i).length).toBeGreaterThan(0);
    });
  });

  it("does not render any hardcoded mock invoices", async () => {
    mockApi.mockResolvedValue({ history: [] });
    renderSubscriptionPage();
    await waitFor(() => {
      // The old hardcoded invoice IDs should never appear
      expect(screen.queryByText(/inv-2026-08/i)).toBeNull();
      expect(screen.queryByText(/inv-2026-07/i)).toBeNull();
    });
  });
});

// ── REH-139 Tests ──────────────────────────────────────────────────────────
describe("SubscriptionPage – cancel subscription (REH-139)", () => {
  beforeEach(() => {
    mockApi.mockResolvedValue({ history: [] });
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: "user-1",
        role: "researcher",
        subscription_tier: "subscribed",
        subscription_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
    });
  });

  it("shows Cancel / Pause button for subscribed users", async () => {
    renderSubscriptionPage();
    await waitFor(() => {
      expect(screen.getByText(/cancel \/ pause subscription/i)).toBeTruthy();
    });
  });

  it("does NOT show Cancel button for free-tier users", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "user-2", role: "researcher", subscription_tier: "free", subscription_expires_at: null },
    });
    renderSubscriptionPage();
    await waitFor(() => {
      expect(screen.queryByText(/cancel \/ pause subscription/i)).toBeNull();
    });
  });

  it("opens confirmation modal on Cancel click", async () => {
    renderSubscriptionPage();
    await waitFor(() => screen.getByText(/cancel \/ pause subscription/i));
    fireEvent.click(screen.getByText(/cancel \/ pause subscription/i));
    expect(screen.getByText(/pause or cancel subscription\?/i)).toBeTruthy();
  });

  it("calls DELETE /wallet/researcher/subscription on Confirm Cancellation", async () => {
    const deleteSpy = vi.fn().mockResolvedValue({
      message: "Cancelled",
      subscription_expires_at: new Date().toISOString(),
    });

    mockApi.mockImplementation((url: string, opts?: { method?: string }) => {
      if (opts?.method === "DELETE") return deleteSpy(url, opts);
      return Promise.resolve({ history: [] });
    });

    renderSubscriptionPage();
    await waitFor(() => screen.getByText(/cancel \/ pause subscription/i));
    fireEvent.click(screen.getByText(/cancel \/ pause subscription/i));
    await waitFor(() => screen.getByText(/confirm cancellation/i));
    fireEvent.click(screen.getByText(/confirm cancellation/i));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
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


