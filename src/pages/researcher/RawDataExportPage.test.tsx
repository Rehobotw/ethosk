import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RawDataExportPage } from "./RawDataExportPage";
import { LanguageProvider } from "@/lib/language";

function renderRawDataExportPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/researcher/export-raw-data"]}>
        <Routes>
          <Route path="/researcher/export-raw-data" element={<RawDataExportPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Raw Data Export (Final) (Stitch Screen edfdad6d94d94fb9bd95fd05156e124d)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, Pro Tier badge, format selection grid, date/quality dropdowns, and download button", () => {
    renderRawDataExportPage();

    expect(screen.getByRole("heading", { name: "Raw Data Export" })).toBeDefined();
    expect(screen.getByText("Included in Pro Tier")).toBeDefined();

    // Export Format options
    expect(screen.getByText("CSV")).toBeDefined();
    expect(screen.getByText("SPSS (.sav)")).toBeDefined();
    expect(screen.getByText("Excel (.xlsx)")).toBeDefined();

    // Dropdowns
    expect(screen.getByText("Date Range")).toBeDefined();
    expect(screen.getByText("Response Quality")).toBeDefined();

    // Export Preview
    expect(screen.getByText("Estimated Export Size")).toBeDefined();
    expect(screen.getByText("312")).toBeDefined();
    expect(screen.getByText("Records found")).toBeDefined();

    // Action button
    expect(
      screen.getByRole("button", { name: /Generate & Download Export/i }),
    ).toBeDefined();
  });

  it("changes format selection when format buttons are clicked", () => {
    renderRawDataExportPage();

    const spssBtn = screen.getByText("SPSS (.sav)").closest("button");
    if (spssBtn) {
      fireEvent.click(spssBtn);
      expect(spssBtn.className).toContain("bg-[#eff4ff]");
    }
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderRawDataExportPage();

    expect(screen.getByRole("heading", { name: "ጥሬ መረጃ ኤክስፖርት" })).toBeDefined();
    expect(screen.getByText("ፕሮ ደረጃ")).toBeDefined();
  });
});
