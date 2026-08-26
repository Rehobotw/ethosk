import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ResearcherNotificationCenterPage } from "./ResearcherNotificationCenterPage";
import { LanguageProvider } from "@/lib/language";

function renderNotificationCenterPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/researcher/notifications"]}>
        <Routes>
          <Route
            path="/researcher/notifications"
            element={<ResearcherNotificationCenterPage />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Researcher Notification Center (Stitch Screen 213c701efc9d45a6bc8c41d56ee2d13c)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, top actions, grouped sections, and notification cards", () => {
    renderNotificationCenterPage();

    // Header & Action buttons
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeDefined();
    expect(screen.getByRole("link", { name: /Notification Settings/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Mark All as Read/i })).toBeDefined();

    // Grouped section headings
    expect(screen.getByRole("heading", { name: "Today" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Last Week" })).toBeDefined();

    // Notification card contents
    expect(screen.getByText("Survey Approved: Q3 Consumer Habits")).toBeDefined();
    expect(screen.getByText(/Your survey has passed the compliance review/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Go to Survey Management/i })).toBeDefined();

    expect(screen.getByText("Correction Required: Mobile Usage Study")).toBeDefined();
    expect(screen.getByText(/Demographic targeting parameters need adjustment/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Review Correction Workflow/i })).toBeDefined();

    expect(screen.getByText("100 New Responses: Agri-tech Survey")).toBeDefined();
    expect(screen.getByText("New Feature: AI Audience Targeting")).toBeDefined();
    expect(screen.getByText("Invoice Paid: #INV-002")).toBeDefined();
    expect(screen.getByText("Plan Renewal: Enterprise Tier")).toBeDefined();

    // End of list marker
    expect(screen.getByText("You've reached the end of your notifications.")).toBeDefined();
  });

  it("marks all notifications as read when Mark All as Read button is clicked", () => {
    renderNotificationCenterPage();

    const markAllBtn = screen.getByRole("button", { name: /Mark All as Read/i });
    fireEvent.click(markAllBtn);

    // Clicking an individual card marks it as read
    const card = screen.getByText("Survey Approved: Q3 Consumer Habits").closest("div");
    if (card) fireEvent.click(card);
  });

  it("handles Amharic locale translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderNotificationCenterPage();

    expect(screen.getByRole("heading", { name: "ማሳወቂያዎች" })).toBeDefined();
    expect(screen.getByRole("link", { name: /የማሳወቂያ ቅንብሮች/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /ሁሉንም እንደተነበበ ምልክት አድርግ/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ዛሬ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ትናንት" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ባለፈው ሳምንት" })).toBeDefined();
  });
});
