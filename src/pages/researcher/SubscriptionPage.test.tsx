import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
  api: (...args: unknown[]) => mockApi(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

import { useAuth } from "@/lib/auth";
import { SubscriptionPage } from "./SubscriptionPage";

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
});
