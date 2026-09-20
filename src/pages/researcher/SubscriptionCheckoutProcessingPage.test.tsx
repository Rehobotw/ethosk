import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionCheckoutProcessingPage } from "./SubscriptionCheckoutProcessingPage";
import { LanguageProvider } from "@/lib/language";
import * as apiModule from "@/lib/api";

function renderSubscriptionCheckoutProcessingPage(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/subscription/checkout/processing?plan=pro&billing=annual"]}>
          <Routes>
            <Route
              path="/subscription/checkout/processing"
              element={<SubscriptionCheckoutProcessingPage />}
            />
            <Route
              path="/subscription/checkout/success"
              element={<div>Checkout Success Screen</div>}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Subscription Checkout: Processing (Stitch Screen 2adc77615764481cbf7c3199b440fdc8)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it("renders processing modal, lock icon, and order preview summary", () => {
    vi.spyOn(apiModule, "api").mockReturnValue(new Promise(() => {}));
    renderSubscriptionCheckoutProcessingPage(queryClient);

    expect(screen.getByRole("heading", { name: "Processing Payment" })).toBeDefined();
    expect(
      screen.getByText(/Please wait while we confirm your subscription/i),
    ).toBeDefined();
    expect(screen.getByText("Order Summary")).toBeDefined();
    expect(screen.getByText("Professional Plan")).toBeDefined();
    expect(screen.getByText("$39.00")).toBeDefined();
    expect(screen.getByText("Tax (VAT 15%)")).toBeDefined();
  });

  it("calls /wallet/researcher/subscription API and navigates to success on successful charge", async () => {
    vi.spyOn(apiModule, "api").mockResolvedValue({
      profile: { subscription_tier: "subscribed" },
      wallet: { available_etb: 4500 },
    });

    renderSubscriptionCheckoutProcessingPage(queryClient);

    await waitFor(() => {
      expect(screen.getByText("Checkout Success Screen")).toBeDefined();
    });
  });

  it("displays payment failure state and wallet deposit action when balance is insufficient", async () => {
    vi.spyOn(apiModule, "api").mockRejectedValue(
      new apiModule.ApiRequestError(
        402,
        "INSUFFICIENT_FUNDS",
        "You do not have enough available balance to purchase a subscription.",
      ),
    );

    renderSubscriptionCheckoutProcessingPage(queryClient);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Payment Failed" })).toBeDefined();
      expect(
        screen.getByText(/You do not have enough available balance to purchase a subscription/i),
      ).toBeDefined();
      expect(screen.getByRole("button", { name: /Add Funds to Wallet/i })).toBeDefined();
    });
  });

  it("handles Amharic translations during processing", () => {
    localStorage.setItem("ethosk-language", "am");
    vi.spyOn(apiModule, "api").mockReturnValue(new Promise(() => {}));

    renderSubscriptionCheckoutProcessingPage(queryClient);

    expect(screen.getByRole("heading", { name: "ክፍያ በመከናወን ላይ ነው" })).toBeDefined();
    expect(
      screen.getByText(/እባክዎ ምዝገባዎን እስክናረጋግጥ ድረስ ይጠብቁ/i),
    ).toBeDefined();
  });
});
