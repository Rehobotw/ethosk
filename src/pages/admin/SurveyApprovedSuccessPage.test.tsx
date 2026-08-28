import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SurveyApprovedSuccessPage } from "./SurveyApprovedSuccessPage";
import { LanguageProvider } from "@/lib/language";

function renderSurveyApprovedSuccessPage(initialState?: {
  surveyTitle?: string;
  adminName?: string;
  timestamp?: string;
}) {
  return render(
    <LanguageProvider>
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/admin/survey-approvals/srv-noise-1/success",
            state: initialState,
          },
        ]}
      >
        <Routes>
          <Route
            path="/admin/survey-approvals/:id/success"
            element={<SurveyApprovedSuccessPage />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Survey Approved Success State (Stitch Screen bbc2fa584f964f43b5d7b152f094e065)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders success headline, description, details box with timestamp and administrator", () => {
    renderSurveyApprovedSuccessPage({
      surveyTitle: "Impact of Urban Noise on Sleep Quality",
      adminName: "Abebe Admin",
      timestamp: "Oct 25, 2023, 11:45 AM UTC",
    });

    // Headline & Subtitle
    expect(screen.getByRole("heading", { name: "Survey Successfully Approved" })).toBeDefined();
    expect(
      screen.getByText(
        /The survey has been verified and moved out of the approval queue\. It is now active and ready for deployment\./i,
      ),
    ).toBeDefined();

    // Data Details Box
    expect(screen.getByText("Survey Name")).toBeDefined();
    expect(screen.getByText("Impact of Urban Noise on Sleep Quality")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Approved")).toBeDefined();
    expect(screen.getByText("Timestamp")).toBeDefined();
    expect(screen.getByText("Oct 25, 2023, 11:45 AM UTC")).toBeDefined();
    expect(screen.getByText("Approved By")).toBeDefined();
    expect(screen.getByText("Abebe Admin")).toBeDefined();
    expect(screen.getByText("AA")).toBeDefined();

    // Action buttons
    expect(screen.getByRole("button", { name: /Return to Review Queue/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /View Survey Details/i })).toBeDefined();
  });

  it("handles Amharic locale translation", () => {
    localStorage.setItem("ethosk-language", "am");

    renderSurveyApprovedSuccessPage({
      surveyTitle: "የከተማ ጫጫታ በእንቅልፍ ጥራት ላይ ያለው ተጽዕኖ",
      adminName: "አበበ አስተዳዳሪ",
    });

    expect(screen.getByRole("heading", { name: "ጥናቱ በተሳካ ሁኔታ ጸድቋል" })).toBeDefined();
    expect(screen.getByText("ጸድቋል")).toBeDefined();
    expect(screen.getByRole("button", { name: /ወደ ግምገማ ወረፋ ተመለስ/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /የጥናቱን ዝርዝር እይ/i })).toBeDefined();
  });
});
