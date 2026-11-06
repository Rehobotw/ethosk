import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SUBSCRIPTION_PLANS, formatCurrencyEtb, formatPricePerMonth } from "../../../shared/pricing.js";
import { ChooseSubscriptionPlanPage } from "./ChooseSubscriptionPlanPage";
import { SubscriptionCheckoutProcessingPage } from "./SubscriptionCheckoutProcessingPage";
import { SubscriptionCheckoutSuccessPage } from "./SubscriptionCheckoutSuccessPage";
import { ResearcherWalletPage } from "./WalletPage";
import { SubscriptionPage } from "./SubscriptionPage";

const mockSubscribedUser = {
  id: "usr-pro-1",
  email: "pro@aau.edu.et",
  role: "researcher",
  subscription_tier: "subscribed",
  subscription_expires_at: "2026-10-01T00:00:00Z",
};

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: mockSubscribedUser,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/language", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockResolvedValue({
    wallet: { available_etb: 5000, reserved_etb: 0, lifetime_deposited_etb: 10000 },
    deposits: [],
    commitments: [],
    paymentDestinations: {},
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Pricing Single Source of Truth across screens (REH-129)", () => {
  it("defines standard subscription plan constants correctly", () => {
    expect(SUBSCRIPTION_PLANS.basic.priceEtb).toBe(0);
    expect(SUBSCRIPTION_PLANS.pro.priceEtb).toBe(2500);
    expect(SUBSCRIPTION_PLANS.pro.priceUsd).toBe(49);
    expect(SUBSCRIPTION_PLANS.enterprise.isCustom).toBe(true);
    expect(formatCurrencyEtb(2500)).toBe("2,500 ETB");
    expect(formatPricePerMonth("pro")).toBe("2,500 ETB/mo");
  });

  it("ChooseSubscriptionPlanPage renders identical Pro price from shared constant", () => {
    renderWithProviders(<ChooseSubscriptionPlanPage />);
    const proPriceEl = screen.getByTestId("pro-plan-price");
    expect(proPriceEl.textContent).toContain(formatCurrencyEtb(SUBSCRIPTION_PLANS.pro.priceEtb));
  });

  it("SubscriptionCheckoutProcessingPage renders identical Pro price from shared constant", () => {
    renderWithProviders(<SubscriptionCheckoutProcessingPage />);
    const checkoutPriceEl = screen.getByTestId("checkout-pro-price");
    expect(checkoutPriceEl.textContent).toContain(formatCurrencyEtb(SUBSCRIPTION_PLANS.pro.priceEtb));
  });

  it("SubscriptionCheckoutSuccessPage renders identical Pro price from shared constant", () => {
    renderWithProviders(<SubscriptionCheckoutSuccessPage />);
    const successPriceEl = screen.getByTestId("success-pro-price");
    expect(successPriceEl.textContent).toContain(formatCurrencyEtb(SUBSCRIPTION_PLANS.pro.priceEtb));
  });

  it("WalletPage renders identical Pro price from shared constant", async () => {
    renderWithProviders(<ResearcherWalletPage />);
    await screen.findByTestId("wallet-subscription-price").then((walletPriceEl) => {
      expect(walletPriceEl.textContent).toBe(formatPricePerMonth("pro"));
    });
  });

  it("SubscriptionPage renders identical Pro price from shared constant in active banner and cards", () => {
    renderWithProviders(<SubscriptionPage />);
    const subBannerPrice = screen.getByTestId("subscription-page-price");
    expect(subBannerPrice.textContent).toContain(formatCurrencyEtb(SUBSCRIPTION_PLANS.pro.priceEtb));

    const subProPrice = screen.getByTestId("sub-page-pro-price");
    expect(subProPrice.textContent).toBe("2,500");
  });
});
