import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";
import { LanguageProvider } from "@/lib/language";

function renderPrivacyPolicyPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/privacy"]}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Privacy Policy (Stitch Screen b9657a94beb747508336fb4d86087b80)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, sidebar sections, all 5 policy sections, rights cards, and support CTA", () => {
    renderPrivacyPolicyPage();

    // Main Header
    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeDefined();
    expect(screen.getByText(/Effective Date:/i)).toBeDefined();
    expect(screen.getByText(/October 2023/i)).toBeDefined();

    // Privacy Center Sidebar
    expect(screen.getByText("Privacy Center")).toBeDefined();
    expect(screen.getByRole("button", { name: /1\. Information Collection/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /2\. How We Use Data/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /3\. Data Sharing/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /4\. Data Security/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /5\. Your Rights/i })).toBeDefined();

    // Content Sections
    expect(screen.getByRole("heading", { name: /1.*Information Collection/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /2.*How We Use Data/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /3.*Data Sharing/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /4.*Data Security/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /5.*Your Rights/i })).toBeDefined();

    // Key content items
    expect(screen.getByText(/Fayda ID Integration/i)).toBeDefined();
    expect(screen.getByText("Institutional Researcher Access")).toBeDefined();

    // Rights cards
    expect(screen.getByRole("heading", { name: "Access" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Correction" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Deletion" })).toBeDefined();

    // Bottom CTA
    expect(screen.getByText("Still have questions?")).toBeDefined();
    expect(screen.getByRole("link", { name: /Contact Support/i })).toBeDefined();
  });

  it("handles sidebar section click and scrolls into view", () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderPrivacyPolicyPage();

    const sharingBtn = screen.getByRole("button", { name: /3\. Data Sharing/i });
    fireEvent.click(sharingBtn);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderPrivacyPolicyPage();

    expect(
      screen.getByRole("heading", { name: "የግላዊነት መመሪያ" }),
    ).toBeDefined();
    expect(screen.getByText("የግላዊነት ማዕከል")).toBeDefined();
    expect(screen.getByRole("button", { name: /1\. የመረጃ አሰባሰብ/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /2\. የመረጃ አጠቃቀም/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /3\. መረጃ መጋራት/i })).toBeDefined();
  });
});
