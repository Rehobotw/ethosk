import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TermsAndConditionsPage } from "./TermsAndConditionsPage";
import { LanguageProvider } from "@/lib/language";

function renderTermsAndConditionsPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/terms"]}>
        <Routes>
          <Route path="/terms" element={<TermsAndConditionsPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Terms & Conditions (Stitch Screen f65ad9193f004371b46667cace84d125)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, sidebar sections, article sections, DPA box, and footer", () => {
    renderTermsAndConditionsPage();

    // Main Header
    expect(
      screen.getByRole("heading", { name: "Terms & Conditions" }),
    ).toBeDefined();
    expect(screen.getByText(/Last Updated: October 2023/i)).toBeDefined();

    // Legal Center Sidebar
    expect(screen.getByText("Legal Center")).toBeDefined();
    expect(screen.getByRole("button", { name: /1\. Introduction/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /2\. Data Privacy/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /3\. User Conduct/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /4\. Intellectual Property/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /5\. Liability/i })).toBeDefined();

    // Content Sections
    expect(screen.getByRole("heading", { name: /1.*Introduction/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /2.*Data Privacy/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /3.*User Conduct/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /4.*Intellectual Property/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /5.*Liability/i })).toBeDefined();

    // DPA Callout
    expect(screen.getByText("Data Processing Agreement")).toBeDefined();

    // Bottom CTA
    expect(screen.getByRole("link", { name: /Contact Support/i })).toBeDefined();
  });

  it("handles sidebar section click and scrolls into view", () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    renderTermsAndConditionsPage();

    const privacyBtn = screen.getByRole("button", { name: /2\. Data Privacy/i });
    fireEvent.click(privacyBtn);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderTermsAndConditionsPage();

    expect(
      screen.getByRole("heading", { name: "የአገልግሎት ውሎች እና ሁኔታዎች" }),
    ).toBeDefined();
    expect(screen.getByText("የህግ ማዕከል")).toBeDefined();
    expect(screen.getByRole("button", { name: /1\. መግቢያ/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /2\. የመረጃ ግላዊነት/i })).toBeDefined();
  });
});
