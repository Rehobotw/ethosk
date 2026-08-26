import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SubscriptionCheckoutProcessingPage } from "./SubscriptionCheckoutProcessingPage";
import { LanguageProvider } from "@/lib/language";

function renderSubscriptionCheckoutProcessingPage() {
  return render(
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
    </LanguageProvider>,
  );
}

describe("Ethosk - Subscription Checkout: Processing (Stitch Screen 2adc77615764481cbf7c3199b440fdc8)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders processing modal, lock icon, and order preview summary", () => {
    renderSubscriptionCheckoutProcessingPage();

    expect(screen.getByRole("heading", { name: "Processing Payment" })).toBeDefined();
    expect(
      screen.getByText(/Please wait while we confirm your subscription/i),
    ).toBeDefined();
    expect(screen.getByText("Order Summary")).toBeDefined();
    expect(screen.getByText("Professional Plan")).toBeDefined();
    expect(screen.getByText("$39.00")).toBeDefined();
    expect(screen.getByText("Tax (VAT 15%)")).toBeDefined();
  });

  it("allows skipping to success screen via demo button", () => {
    renderSubscriptionCheckoutProcessingPage();

    const skipBtn = screen.getByRole("button", { name: /Skip to Success/i });
    fireEvent.click(skipBtn);

    expect(screen.getByText("Checkout Success Screen")).toBeDefined();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderSubscriptionCheckoutProcessingPage();

    expect(screen.getByRole("heading", { name: "ክፍያ በመከናወን ላይ ነው" })).toBeDefined();
    expect(
      screen.getByText(/እባክዎ ምዝገባዎን እስክናረጋግጥ ድረስ ይጠብቁ/i),
    ).toBeDefined();
  });
});
