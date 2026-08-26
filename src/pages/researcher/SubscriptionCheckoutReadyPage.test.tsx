import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SubscriptionCheckoutReadyPage } from "./SubscriptionCheckoutReadyPage";
import { LanguageProvider } from "@/lib/language";

function renderSubscriptionCheckoutReadyPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/subscription/checkout?plan=pro&billing=annual"]}>
        <Routes>
          <Route path="/subscription/checkout" element={<SubscriptionCheckoutReadyPage />} />
          <Route
            path="/subscription/checkout/processing"
            element={<div>Processing Screen</div>}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Subscription Checkout: Ready (Stitch Screen 0b2a8dffd1b340318a48cee18e4d2c91 - Adapted for verify.et)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, payment method options, billing fields, and ETB order summary", () => {
    renderSubscriptionCheckoutReadyPage();

    // Header
    expect(screen.getByRole("heading", { name: "Secure Checkout" })).toBeDefined();

    // Payment Methods
    expect(screen.getByText("Payment Method")).toBeDefined();
    expect(screen.getByText("Telebirr")).toBeDefined();
    expect(screen.getByText("CBE Birr")).toBeDefined();
    expect(screen.getByText("Escrow Wallet")).toBeDefined();
    expect(screen.getByText("verify.et")).toBeDefined();

    // Order Summary in ETB
    expect(screen.getByRole("heading", { name: "Order Summary" })).toBeDefined();
    expect(screen.getByText("Professional Researcher")).toBeDefined();
    expect(screen.getByText("4,700 ETB/yr")).toBeDefined();
    expect(screen.getByText("Tax (15% VAT)")).toBeDefined();
    expect(screen.getByText("5405.00 ETB")).toBeDefined();

    // Submit button
    expect(
      screen.getByRole("button", { name: /Confirm and Pay via verify.et/i }),
    ).toBeDefined();
  });

  it("switches payment methods to CBE Birr and Wallet", () => {
    renderSubscriptionCheckoutReadyPage();

    const cbeBtn = screen.getByRole("button", { name: /CBE Birr/i });
    fireEvent.click(cbeBtn);
    expect(screen.getByText("CBE Birr Phone or Account Number")).toBeDefined();

    const walletBtn = screen.getByRole("button", { name: /Escrow Wallet/i });
    fireEvent.click(walletBtn);
    expect(screen.getByText(/Deduct directly from Wallet balance/i)).toBeDefined();
  });

  it("submits checkout form and navigates to processing", () => {
    renderSubscriptionCheckoutReadyPage();

    const submitBtn = screen.getByRole("button", { name: /Confirm and Pay via verify.et/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Processing Screen")).toBeDefined();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderSubscriptionCheckoutReadyPage();

    expect(screen.getByRole("heading", { name: "ደህንነቱ የተጠበቀ ክፍያ" })).toBeDefined();
    expect(screen.getByText("የክፍያ ዘዴ")).toBeDefined();
    expect(screen.getByText("የክፍያ አድራሻ")).toBeDefined();
    expect(screen.getByRole("heading", { name: "የትዕዛዝ ማጠቃለያ" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /አረጋግጥ እና በverify.et ክፈል/i }),
    ).toBeDefined();
  });
});
