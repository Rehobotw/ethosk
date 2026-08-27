import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminNotificationCenterPage } from "./AdminNotificationCenterPage";
import { LanguageProvider } from "@/lib/language";

function renderAdminNotificationCenterPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/admin/notifications"]}>
        <Routes>
          <Route path="/admin/notifications" element={<AdminNotificationCenterPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Admin Notification Center (Stitch Screen f4055d260cd8477bba394ea9f90bfffd)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, top actions, grouped sections, and admin notification cards", () => {
    renderAdminNotificationCenterPage();

    // Header & Action buttons
    expect(screen.getByRole("heading", { name: "Admin Notifications" })).toBeDefined();
    expect(screen.getByRole("button", { name: /Mark All as Read/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Notification Settings/i })).toBeDefined();

    // Grouped section headings
    expect(screen.getByRole("heading", { name: "Today" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeDefined();

    // Notification Cards
    expect(screen.getByText("High Priority: API Latency detected")).toBeDefined();
    expect(screen.getByText("System Alert")).toBeDefined();
    expect(screen.getByRole("link", { name: /System Status/i })).toBeDefined();

    expect(screen.getByText("New Survey Submitted: Healthcare Access Study")).toBeDefined();
    expect(screen.getByText("Survey Review")).toBeDefined();
    expect(screen.getByRole("link", { name: /Review Survey/i })).toBeDefined();

    expect(screen.getByText("Large Withdrawal Request: 50,000 ETB")).toBeDefined();
    expect(screen.getByText("Researcher Identity Pending: Dr. Selamawit G.")).toBeDefined();
    expect(screen.getByText("Audit Log Export Ready")).toBeDefined();
  });

  it("handles settings panel toggle and mark all as read action", () => {
    renderAdminNotificationCenterPage();

    const settingsBtn = screen.getByRole("button", { name: /Notification Settings/i });
    fireEvent.click(settingsBtn);
    expect(screen.getByText("Alert Filters & Preferences")).toBeDefined();

    const markAllBtn = screen.getByRole("button", { name: /Mark All as Read/i });
    fireEvent.click(markAllBtn);

    const card = screen.getByText("High Priority: API Latency detected").closest("div");
    if (card) fireEvent.click(card);
  });

  it("handles Amharic locale translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderAdminNotificationCenterPage();

    expect(screen.getByRole("heading", { name: "የአስተዳዳሪ ማሳወቂያዎች" })).toBeDefined();
    expect(screen.getByRole("button", { name: /ሁሉንም እንደተነበበ ምልክት አድርግ/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ዛሬ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ትናንት" })).toBeDefined();
  });
});
