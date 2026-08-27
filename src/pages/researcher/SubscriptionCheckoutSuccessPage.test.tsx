import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SubscriptionCheckoutSuccessPage } from "./SubscriptionCheckoutSuccessPage";
import { LanguageProvider } from "@/lib/language";

function renderSubscriptionCheckoutSuccessPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/subscription/checkout/success?plan=pro&billing=annual"]}>
        <Routes>
          <Route
            path="/subscription/checkout/success"
            element={<SubscriptionCheckoutSuccessPage />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Subscription Checkout: Success (Stitch Screen fa080469b751426b87640d53576d7e28)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders success heading, order details, and action buttons", () => {
    renderSubscriptionCheckoutSuccessPage();

    expect(screen.getByRole("heading", { name: "Payment Successful!" })).toBeDefined();
    expect(
      screen.getByText(/Your Professional Plan is now active/i),
    ).toBeDefined();

    expect(screen.getByText("ETH-8942-XJ")).toBeDefined();
    expect(screen.getByText("$39.00 USD")).toBeDefined();

    expect(screen.getByRole("link", { name: /Go to Dashboard/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Download Receipt/i })).toBeDefined();
  });

  it("handles receipt download click", () => {
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();

    renderSubscriptionCheckoutSuccessPage();

    const downloadBtn = screen.getByRole("button", { name: /Download Receipt/i });
    fireEvent.click(downloadBtn);
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderSubscriptionCheckoutSuccessPage();

    expect(
      screen.getByRole("heading", { name: "ክፍያው በተሳካ ሁኔታ ተጠናቋል!" }),
    ).toBeDefined();
    expect(screen.getByText("የትዕዛዝ ቁጥር")).toBeDefined();
    expect(screen.getByRole("link", { name: /ወደ ዳሽቦርድ ሂድ/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /ደረሰኝ አውርድ/i })).toBeDefined();
  });
});
