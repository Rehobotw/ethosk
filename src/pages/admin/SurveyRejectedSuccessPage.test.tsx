import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SurveyRejectedSuccessPage } from "./SurveyRejectedSuccessPage";
import { LanguageProvider } from "@/lib/language";

function renderSurveyRejectedSuccessPage(initialState?: {
  surveyTitle?: string;
  adminName?: string;
  reason?: string;
  notes?: string;
  timestamp?: string;
}) {
  return render(
    <LanguageProvider>
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/admin/survey-approvals/srv-noise-1/rejected",
            state: initialState,
          },
        ]}
      >
        <Routes>
          <Route
            path="/admin/survey-approvals/:id/rejected"
            element={<SurveyRejectedSuccessPage />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Survey Rejected Success State (Stitch Screen 58fb5b31bd934972be6f74522fc7f841)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders rejection icon, headline, survey summary card, reason and notes", () => {
    renderSurveyRejectedSuccessPage({
      surveyTitle: "Impact of Urban Noise on Sleep Quality",
      adminName: "Abebe Admin",
      reason: "Ethical Non-Compliance",
      notes: "The participant consent forms provided do not meet the minimum requirements.",
      timestamp: "Oct 25, 2023, 11:50 AM UTC",
    });

    // Headline & Subtitle
    expect(screen.getByRole("heading", { name: "Survey Successfully Rejected" })).toBeDefined();
    expect(
      screen.getByText(
        /The survey status has been updated to Rejected and the researcher has been notified with the provided explanation\./i,
      ),
    ).toBeDefined();

    // Summary Card
    expect(screen.getByText("Survey Summary")).toBeDefined();
    expect(screen.getByText("Rejected")).toBeDefined();
    expect(screen.getByText("Impact of Urban Noise on Sleep Quality")).toBeDefined();
    expect(screen.getByText("Oct 25, 2023, 11:50 AM UTC")).toBeDefined();
    expect(screen.getByText("Abebe Admin")).toBeDefined();
    expect(screen.getByText("Ethical Non-Compliance")).toBeDefined();
    expect(
      screen.getByText(
        /"The participant consent forms provided do not meet the minimum requirements\."/i,
      ),
    ).toBeDefined();

    // Footer actions
    expect(screen.getByRole("link", { name: /View Survey History/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Return to Queue/i })).toBeDefined();
  });

  it("handles Amharic locale translation", () => {
    localStorage.setItem("ethosk-language", "am");

    renderSurveyRejectedSuccessPage({
      surveyTitle: "የከተማ ጫጫታ በእንቅልፍ ጥራት ላይ ያለው ተጽዕኖ",
      adminName: "አበበ አስተዳዳሪ",
      reason: "የስነምግባር ደንብ አለማሟላት",
      notes: "የስምምነት ቅጾች አልተሟሉም",
    });

    expect(screen.getByRole("heading", { name: "ጥናቱ ውድቅ ተደርጓል" })).toBeDefined();
    expect(screen.getByText("ውድቅ ተደርጓል")).toBeDefined();
    expect(screen.getByRole("link", { name: /የጥናቱን ታሪክ እይ/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /ወደ ወረፋው ተመለስ/i })).toBeDefined();
  });
});
