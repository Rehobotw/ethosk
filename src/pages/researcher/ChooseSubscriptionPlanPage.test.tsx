import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ChooseSubscriptionPlanPage } from "./ChooseSubscriptionPlanPage";
import { LanguageProvider } from "@/lib/language";

function renderChooseSubscriptionPlanPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/subscription/plans"]}>
        <Routes>
          <Route path="/subscription/plans" element={<ChooseSubscriptionPlanPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Choose Subscription Plan (Stitch Screen 38ccf487ee184529aa928cfae24138af)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders active plan banner, pricing toggle, and 3 tier cards", () => {
    renderChooseSubscriptionPlanPage();

    // Banner
    expect(screen.getByText("Current Active Plan")).toBeDefined();
    expect(screen.getByText("Basic Researcher")).toBeDefined();
    expect(screen.getByText("Cancel Subscription")).toBeDefined();

    // Header & Toggle
    expect(screen.getByRole("heading", { name: "Upgrade Your Research" })).toBeDefined();
    expect(screen.getByText("Monthly")).toBeDefined();
    expect(screen.getByText("Annually")).toBeDefined();

    // 3 Tier Cards
    expect(screen.getByRole("heading", { name: "Basic" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Professional" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Enterprise" })).toBeDefined();

    // Recommended badge & actions
    expect(screen.getByText("Recommended")).toBeDefined();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Contact Sales" })).toBeDefined();
  });

  it("toggles billing period between annual and monthly", () => {
    renderChooseSubscriptionPlanPage();

    expect(screen.getByText("$39")).toBeDefined();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(screen.getByText("$49")).toBeDefined();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderChooseSubscriptionPlanPage();

    expect(screen.getByRole("heading", { name: "ምርምርዎን ያሻሽሉ" })).toBeDefined();
    expect(screen.getByText("የአሁኑ ንቁ እቅድ")).toBeDefined();
    expect(screen.getByText("መሰረታዊ ተመራማሪ")).toBeDefined();
    expect(screen.getByRole("button", { name: "ወደ ፕሮ አሻሽል" })).toBeDefined();
  });
});
