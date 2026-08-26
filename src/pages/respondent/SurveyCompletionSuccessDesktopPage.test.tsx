import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SurveyCompletionSuccessDesktopPage } from "./SurveyCompletionSuccessDesktopPage";
import { LanguageProvider } from "@/lib/language";

function renderSurveyCompletionSuccessDesktopPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/survey/completion-success"]}>
        <Routes>
          <Route
            path="/survey/completion-success"
            element={<SurveyCompletionSuccessDesktopPage />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Survey Completion Success (Desktop) (Stitch Screen 3a1f2c479936463890d8569710a2eeba)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders desktop success heading, study title subtitle, data grid, processing status, and action CTAs", () => {
    renderSurveyCompletionSuccessDesktopPage();

    expect(
      screen.getByRole("heading", { name: "Survey Completed Successfully" }),
    ).toBeDefined();
    expect(
      screen.getByText(/Highland Crop Yield Patterns/i),
    ).toBeDefined();

    // Data grid
    expect(screen.getByText("Oct 24, 2023")).toBeDefined();
    expect(screen.getByText("50 ETB")).toBeDefined();
    expect(screen.getByText("Processing")).toBeDefined();
    expect(screen.getByText("(Transferred to Wallet in 24h)")).toBeDefined();

    // Next steps
    expect(screen.getByText(/Your results are now being verified by the researcher/i)).toBeDefined();

    // CTAs
    expect(screen.getByRole("link", { name: /View Earnings/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Browse More Surveys/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Return to Dashboard/i })).toBeDefined();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderSurveyCompletionSuccessDesktopPage();

    expect(
      screen.getByRole("heading", { name: "ጥናቱ በተሳካ ሁኔታ ተጠናቋል" }),
    ).toBeDefined();
    expect(screen.getByText("በሂደት ላይ")).toBeDefined();
  });
});
