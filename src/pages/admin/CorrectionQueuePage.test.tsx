import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CorrectionQueuePage } from "./CorrectionQueuePage";
import { LanguageProvider } from "@/lib/language";

function renderCorrectionQueuePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/admin/correction-queue"]}>
          <Routes>
            <Route path="/admin/correction-queue" element={<CorrectionQueuePage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Returned / Correction Queue (Stitch Screen deab2b40fd78484db04a418c941de186)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, 4 queue tabs, search filters, and table rows", async () => {
    renderCorrectionQueuePage();

    await waitFor(() => {
      // Header & Breadcrumb
      expect(screen.getByRole("heading", { name: "Correction & Resubmission Queue" })).toBeDefined();
      expect(screen.getByText("Export List")).toBeDefined();
    });

    // 4 Tabs
    expect(screen.getByRole("button", { name: /Needs Correction/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Returned to Researcher/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Awaiting Resubmission/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Resubmitted/i })).toBeDefined();

    // Active tab rows
    expect(screen.getByText("Impact of Urban Noise on Sleep Quality")).toBeDefined();
    expect(screen.getByText(/SRV-2023-0892/i)).toBeDefined();
    expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    expect(screen.getByText("Machine Learning in Supply Chain")).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Review Request/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("switches tabs and displays corresponding items or empty state", async () => {
    renderCorrectionQueuePage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Awaiting Resubmission/i })).toBeDefined();
    });

    // Switch to Awaiting Resubmission
    const awaitingTab = screen.getByRole("button", { name: /Awaiting Resubmission/i });
    fireEvent.click(awaitingTab);

    expect(screen.getByText("Agricultural Productivity in Amhara")).toBeDefined();
    expect(screen.getByText(/SRV-2023-1104/i)).toBeDefined();
    expect(screen.getByText("Dawit Abebe")).toBeDefined();
    expect(screen.getByRole("button", { name: /View History/i })).toBeDefined();

    // Switch to Resubmitted (Empty State)
    const resubmittedTab = screen.getByRole("button", { name: /Resubmitted/i });
    fireEvent.click(resubmittedTab);

    expect(screen.getByText("No resubmissions found")).toBeDefined();
    expect(
      screen.getByText(
        /All returned surveys are currently with researchers or pending initial correction\. Check back later\./i,
      ),
    ).toBeDefined();
  });

  it("filters items by search keyword", async () => {
    renderCorrectionQueuePage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Filter this view...")).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText("Filter this view...");
    fireEvent.change(searchInput, { target: { value: "Urban Noise" } });

    expect(screen.getByText("Impact of Urban Noise on Sleep Quality")).toBeDefined();
    expect(screen.queryByText("Machine Learning in Supply Chain")).toBeNull();
  });

  it("triggers CSV export when Export List is clicked", async () => {
    renderCorrectionQueuePage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Export List/i })).toBeDefined();
    });

    const exportBtn = screen.getByRole("button", { name: /Export List/i });
    expect(exportBtn).toBeDefined();
    fireEvent.click(exportBtn);
  });
});
