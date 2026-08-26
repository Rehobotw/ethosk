import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WithdrawalHistoryPage } from "./WithdrawalHistoryPage";
import { LanguageProvider } from "@/lib/language";

function renderWithdrawalHistoryPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/wallet/history"]}>
        <Routes>
          <Route path="/wallet/history" element={<WithdrawalHistoryPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Withdrawal History (Photo-Aligned) (Stitch Screen 260175667ecb434f97f9779c54370059)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders header, back link, summary cards, and transactions table", () => {
    renderWithdrawalHistoryPage();

    // Header & Back link
    expect(screen.getByRole("heading", { name: "Withdrawal History" })).toBeDefined();
    expect(screen.getByText("Back to Wallet")).toBeDefined();

    // Summary Cards
    expect(screen.getByText("Total Withdrawn")).toBeDefined();
    expect(screen.getByText("4,150")).toBeDefined();
    expect(screen.getByText("Pending Withdrawals")).toBeDefined();
    expect(screen.getByText("500")).toBeDefined();

    // Table Column Headers
    expect(screen.getAllByText("Amount").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Destination").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Transaction Ref").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Status").length).toBeGreaterThanOrEqual(1);

    // Row contents
    expect(screen.getAllByText("#TXN-99218").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("#TXN-99105").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1,000 ETB").length).toBeGreaterThanOrEqual(1);
  });

  it("filters transactions by status", () => {
    renderWithdrawalHistoryPage();

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "processing" } });

    expect(screen.getAllByText("#TXN-99105").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("#TXN-99218")).toBeNull();
  });

  it("filters transactions by search query", () => {
    renderWithdrawalHistoryPage();

    const searchInput = screen.getByPlaceholderText(/Search Txn ID.../i);
    fireEvent.change(searchInput, { target: { value: "98992" } });

    expect(screen.getAllByText("#TXN-98992").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("#TXN-99218")).toBeNull();
  });

  it("handles Amharic locale translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderWithdrawalHistoryPage();

    expect(screen.getByRole("heading", { name: "የመውጫ ታሪክ" })).toBeDefined();
    expect(screen.getByText("ወደ ዋሌት ተመለስ")).toBeDefined();
    expect(screen.getByText("ጠቅላላ የተወሰደ")).toBeDefined();
    expect(screen.getByText("በመጠባበቅ ላይ ያሉ")).toBeDefined();
  });
});
