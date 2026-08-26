import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletPage } from "./WalletPage";

const mockWallet = {
  available_etb: 450,
  pending_etb: 80,
  withdrawn_etb: 1200,
  lifetime_etb: 1730,
  paid_response_count: 12,
};

const mockPayouts = [
  {
    id: "wd-rec-1",
    survey_id: "",
    amount_etb: 250,
    net_amount_etb: 250,
    platform_fee_etb: 0,
    status: "completed",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    survey_title: "Withdrawal to Telebirr",
    is_withdrawal: true,
    payout_method: "Telebirr",
    account_number: "0912345678",
    verification_status: "verified",
    verification_notes: "Paid — verified via verify.et",
  },
  {
    id: "wd-rec-2",
    survey_id: "",
    amount_etb: 150,
    net_amount_etb: 150,
    platform_fee_etb: 0,
    status: "needs_review",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    survey_title: "Withdrawal to CBE Birr",
    is_withdrawal: true,
    payout_method: "CBE Birr",
    account_number: "1000987654321",
    verification_status: "unsupported_provider",
    verification_notes: "Queued for manual admin reconciliation",
  },
  {
    id: "pay-rec-3",
    survey_id: "srv-101",
    amount_etb: 100,
    net_amount_etb: 90,
    platform_fee_etb: 10,
    status: "completed",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    survey_title: "FinTech Adoption Survey",
    is_withdrawal: false,
    payout_method: "Survey Reward",
  },
];

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: {
      id: "resp-123",
      email: "respondent@ethosk.com",
      full_name: "Selam Girma",
      role: "respondent",
      verification_tier: "1_id_verified",
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
    if (url === "/wallet/respondent") {
      return Promise.resolve({
        wallet: mockWallet,
        payouts: mockPayouts,
      });
    }
    if (url === "/wallet/respondent/withdraw") {
      const body = opts?.body || {};
      return Promise.resolve({
        status: "completed",
        verification_notes: "Paid — verified via verify.et",
        withdrawal: {
          id: "new-wd-1",
          amount_etb: body.amount_etb,
          method: body.method,
          account_number: body.account_number,
          status: "completed",
          verification_status: "verified",
          verification_notes: "Paid — verified via verify.et",
        },
      });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderRespondentWallet() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <WalletPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Respondent Payout & Withdrawal Reconciliation with verify.et (v4 §3.5, §4.6.1, §7.4 item 12)", () => {
  it("renders transaction history table with 'Paid — verified via verify.et' badge", async () => {
    renderRespondentWallet();

    await waitFor(() => {
      expect(screen.getByText("Wallet & Payouts")).toBeDefined();
      expect(screen.getByText("Withdrawal to Telebirr")).toBeDefined();
      expect(screen.getByText("Withdrawal to CBE Birr")).toBeDefined();
      expect(screen.getByText("FinTech Adoption Survey")).toBeDefined();
    });

    // Verify badge text as specified in Spec v4 §3.5
    expect(screen.getByText("Paid — verified via verify.et")).toBeDefined();
    expect(screen.getByText("Pending Manual Review")).toBeDefined();
  });

  it("opens cashout modal and submits withdrawal request", async () => {
    renderRespondentWallet();

    await waitFor(() => {
      expect(screen.getByText("Withdraw Funds")).toBeDefined();
    });

    const withdrawBtn = screen.getByText("Withdraw Funds");
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g. 0911234567")).toBeDefined();
    });

    const accountInput = screen.getByPlaceholderText("e.g. 0911234567");
    fireEvent.change(accountInput, { target: { value: "0911223344" } });

    const confirmBtn = screen.getByRole("button", { name: /^Withdraw .* ETB/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // Modal closes upon successful withdrawal submission
      expect(screen.queryByPlaceholderText("e.g. 0911234567")).toBeNull();
    });
  });
});
