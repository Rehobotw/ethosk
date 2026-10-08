import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockUser = (tier: string) => ({
  id: "user-1",
  email: "test@ethosk.et",
  role: "researcher",
  subscription_tier: tier,
  subscription_expires_at:
    tier === "subscribed" ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
});

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(() => ({ user: mockUser("free") })),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockResolvedValue({
    wallet: { available_etb: 1500, reserved_etb: 0, lifetime_deposited_etb: 5000 },
    deposits: [],
    commitments: [],
    paymentDestinations: {},
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

import { useAuth } from "@/lib/auth";
import { ResearcherWalletPage } from "./WalletPage";

function renderWallet() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ResearcherWalletPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ResearcherWalletPage – subscription status card (REH-134)", () => {
  it("shows Free Tier badge and Upgrade CTA for free-tier users", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser("free") });
    renderWallet();
    await waitFor(() => {
      expect(screen.getByText(/free tier/i)).toBeTruthy();
      expect(screen.getByText(/community basic/i)).toBeTruthy();
      expect(screen.getByText(/upgrade to pro/i)).toBeTruthy();
    });
  });

  it("shows Active badge and Pro Plan for subscribed users", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser("subscribed") });
    renderWallet();
    await waitFor(() => {
      // getAllByText handles multiple elements matching /active/i
      const activeNodes = screen.getAllByText(/active/i);
      expect(activeNodes.length).toBeGreaterThan(0);
      expect(screen.getByText(/pro plan/i)).toBeTruthy();
      expect(screen.getByText(/manage subscription/i)).toBeTruthy();
    });
  });

  it("shows 0 ETB/mo for free tier and 2,500 ETB/mo for subscribed", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser("free") });
    const { unmount } = renderWallet();
    await waitFor(() => {
      expect(screen.getByText(/0 ETB\/mo/i)).toBeTruthy();
    });
    unmount();

    const qc2 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser("subscribed") });
    render(
      <QueryClientProvider client={qc2}>
        <MemoryRouter>
          <ResearcherWalletPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/2,500 ETB\/mo/i)).toBeTruthy();
    });
  });

  it("asserts subscription card renders correct tier for free and pro users", async () => {
    // 1. Free user assertions
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser("free") });
    const { unmount } = renderWallet();
    await waitFor(() => {
      expect(screen.getByText("Community Basic")).toBeTruthy();
      expect(screen.getByText("Free Tier")).toBeTruthy();
      expect(screen.getByText("0 ETB/mo")).toBeTruthy();
      const upgradeCta = screen.getByTestId("upgrade-to-pro-cta");
      expect(upgradeCta).toBeTruthy();
      expect(upgradeCta.getAttribute("href")).toBe("/researcher/subscription");
      expect(screen.queryByText(/manage subscription/i)).toBeNull();
    });
    unmount();

    // 2. Pro user assertions
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser("subscribed") });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ResearcherWalletPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Pro Plan")).toBeTruthy();
      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges.length).toBeGreaterThan(0);
      expect(screen.getByText("2,500 ETB/mo")).toBeTruthy();
      expect(screen.getByText(/manage subscription/i)).toBeTruthy();
      expect(screen.queryByTestId("upgrade-to-pro-cta")).toBeNull();
      expect(screen.queryByText("Free Tier")).toBeNull();
    });
  });
});

