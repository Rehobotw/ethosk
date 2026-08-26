import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RespondentHelpCenterPage } from "./RespondentHelpCenterPage";
import { LanguageProvider } from "@/lib/language";

function renderRespondentHelpCenterPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/respondent/help"]}>
        <Routes>
          <Route path="/respondent/help" element={<RespondentHelpCenterPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Respondent Help Center: Landing (Stitch Screen 6fd6d3072b46471196dc79ef2c15e4a4)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, hero search, 4 bento category cards, and popular topics", () => {
    renderRespondentHelpCenterPage();

    // Header & Hero
    expect(screen.getByText("Respondent Help Center")).toBeDefined();
    expect(screen.getByRole("heading", { name: "How can we help?" })).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Search for articles, guides, and FAQs/i),
    ).toBeDefined();

    // 4 Bento Category Cards
    expect(screen.getByRole("heading", { name: "Survey Participation" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Verification" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Account Management" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Earnings & Withdrawals" })).toBeDefined();

    // Popular Topics
    expect(screen.getByRole("heading", { name: "Popular Topics & FAQs" })).toBeDefined();
    expect(screen.getByText("How do I withdraw my earnings?")).toBeDefined();
    expect(screen.getByText("Why was I disqualified from a survey?")).toBeDefined();
    expect(screen.getByText("How long does ID verification take?")).toBeDefined();
    expect(screen.getByText("I forgot my password, how do I reset it?")).toBeDefined();
  });

  it("expands FAQ answer when clicking topic", () => {
    renderRespondentHelpCenterPage();

    const faqButton = screen.getByRole("button", {
      name: /How do I withdraw my earnings\?/i,
    });
    fireEvent.click(faqButton);

    expect(screen.getByText(/Navigate to your Wallet page, select Telebirr or CBE Birr/i)).toBeDefined();
  });

  it("filters topics dynamically when typing in search input", () => {
    renderRespondentHelpCenterPage();

    const searchInput = screen.getByPlaceholderText(/Search for articles, guides, and FAQs/i);
    fireEvent.change(searchInput, { target: { value: "password" } });

    expect(screen.getByText("I forgot my password, how do I reset it?")).toBeDefined();
    expect(screen.queryByText("How do I withdraw my earnings?")).toBeNull();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderRespondentHelpCenterPage();

    expect(screen.getByText("የተሳታፊዎች የእርዳታ ማዕከል")).toBeDefined();
    expect(screen.getByRole("heading", { name: "እንዴት ልንረዳዎ እንችላለን?" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የጥናት ተሳትፎ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የማንነት ማረጋገጫ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የመለያ አስተዳደር" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ገቢ እና ማውጣት" })).toBeDefined();
  });
});
