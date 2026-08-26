import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RespondentNotificationCenterPage } from "./RespondentNotificationCenterPage";
import { LanguageProvider } from "@/lib/language";

function renderRespondentNotificationCenterPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/respondent/notifications"]}>
        <Routes>
          <Route
            path="/respondent/notifications"
            element={<RespondentNotificationCenterPage />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Respondent Notification Center (Photo-Aligned) (Stitch Screen 5f2c25b2e4094134bbf82db389176089)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, mark all read button, grouped sections, and notification cards", () => {
    renderRespondentNotificationCenterPage();

    // Header & Action button
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeDefined();
    expect(screen.getByRole("button", { name: /Mark All as Read/i })).toBeDefined();

    // Grouped section headings
    expect(screen.getByRole("heading", { name: "Today" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Older" })).toBeDefined();

    // Notification Cards
    expect(screen.getByText("New Survey Available")).toBeDefined();
    expect(screen.getByText(/A new survey on Consumer Habits is waiting for you/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Browse Surveys/i })).toBeDefined();

    expect(screen.getByText("Earnings Credited")).toBeDefined();
    expect(screen.getByRole("link", { name: /Earnings Dashboard/i })).toBeDefined();

    expect(screen.getByText("Withdrawal Processing")).toBeDefined();
    expect(screen.getByRole("link", { name: /Withdrawal History/i })).toBeDefined();

    expect(screen.getByText("Account Verified")).toBeDefined();
    expect(screen.getByRole("link", { name: /Verification/i })).toBeDefined();

    expect(screen.getByText("New Feature: Express Payouts")).toBeDefined();
    expect(screen.getByText("Security Alert")).toBeDefined();
  });

  it("handles Mark All as Read button click and individual card read click", () => {
    renderRespondentNotificationCenterPage();

    const markAllBtn = screen.getByRole("button", { name: /Mark All as Read/i });
    fireEvent.click(markAllBtn);

    const card = screen.getByText("New Survey Available").closest("div");
    if (card) fireEvent.click(card);
  });

  it("handles Amharic locale translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderRespondentNotificationCenterPage();

    expect(screen.getByRole("heading", { name: "ማሳወቂያዎች" })).toBeDefined();
    expect(screen.getByRole("button", { name: /ሁሉንም እንደተነበበ ምልክት አድርግ/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ዛሬ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ትናንት" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የቀድሞ" })).toBeDefined();
  });
});
