import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RawDataExportPage } from "./RawDataExportPage";
import { LanguageProvider } from "@/lib/language";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn().mockImplementation((url: string) => {
      if (url === "/surveys") {
        return Promise.resolve({
          surveys: [
            { id: "survey-exp-1", title: "Addis Consumer Survey", response_count: 312 },
          ],
        });
      }
      return Promise.resolve({});
    }),
    getToken: vi.fn().mockReturnValue("mock-token"),
  };
});

function renderRawDataExportPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/researcher/export-raw-data"]}>
          <Routes>
            <Route path="/researcher/export-raw-data" element={<RawDataExportPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
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

  it("fetches /api/surveys/:id/export blob and triggers browser download", async () => {
    const mockBlob = new Blob(["response_id,completed_at\nr1,2026-09-10"], { type: "text/csv" });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    global.fetch = mockFetch;
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/mock-blob");
    window.URL.revokeObjectURL = vi.fn();

    renderRawDataExportPage();

    await waitFor(() => {
      expect(screen.getByText("Addis Consumer Survey (312 responses)")).toBeDefined();
    });

    const exportBtn = screen.getByRole("button", { name: /Generate & Download Export/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/surveys/survey-exp-1/export",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        }),
      );
      expect(screen.getByText(/Export generated successfully! Download started./i)).toBeDefined();
    });
  });
});
