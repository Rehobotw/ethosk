import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PaymentConfirmationPage } from "./PaymentConfirmationPage";
import { LanguageProvider } from "@/lib/language";

function renderPaymentConfirmationPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/subscription/confirmation?plan=pro&billing=annual"]}>
        <Routes>
          <Route path="/subscription/confirmation" element={<PaymentConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Payment Confirmation (Stitch Screen e485b4fa37b9492b8fd347c01420ad67)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders success heading, billing badge, unlocked feature list, and action buttons", () => {
    renderPaymentConfirmationPage();

    // Header & Badge
    expect(screen.getByRole("heading", { name: "Subscription Activated!" })).toBeDefined();
    expect(screen.getByText("Your Professional Plan is now active.")).toBeDefined();
    expect(screen.getByText("Billed Annually")).toBeDefined();

    // Feature highlights
    expect(screen.getByText("What's new in your workspace")).toBeDefined();
    expect(screen.getByText("Raw Data Export (CSV/XLSX)")).toBeDefined();
    expect(screen.getByText("UNLOCKED")).toBeDefined();
    expect(screen.getByText("Advanced Insights Analytics")).toBeDefined();
    expect(screen.getByText("1,000 Responses per Survey")).toBeDefined();
    expect(screen.getByText("Custom Demographic Filters")).toBeDefined();

    // Action buttons
    expect(screen.getByRole("link", { name: /Continue to Dashboard/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Download Receipt/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /View Billing Settings/i })).toBeDefined();
  });

  it("handles receipt download click", () => {
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();

    renderPaymentConfirmationPage();

    const downloadBtn = screen.getByRole("button", { name: /Download Receipt/i });
    fireEvent.click(downloadBtn);
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderPaymentConfirmationPage();

    expect(screen.getByRole("heading", { name: "ምዝገባዎ ነቅቷል!" })).toBeDefined();
    expect(screen.getByText("በስራ ቦታዎ ላይ ምን አዲስ ነገር አለ")).toBeDefined();
    expect(screen.getByText("ተከፍቷል")).toBeDefined();
    expect(screen.getByRole("link", { name: /ወደ ዳሽቦርድ ቀጥል/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /ደረሰኝ አውርድ/i })).toBeDefined();
  });
});
