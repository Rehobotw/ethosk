import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResearcherWalletPage } from "./WalletPage";

const mockWallet = {
  deposited_etb: 50000,
  reserved_etb: 15000,
  available_etb: 35000,
};

const mockProfile = {
  institution: "Addis Ababa University",
  institutional_email: "research@aau.edu.et",
  verified: true,
};

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-123",
      email: "researcher@example.com",
      full_name: "Dr. Aster",
      role: "researcher",
      verification_tier: "1_id_verified",
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
    if (url === "/wallet/researcher") {
      return Promise.resolve({
        wallet: mockWallet,
        deposits: [],
        commitments: [],
      });
    }
    if (url === "/researchers/profile") {
      return Promise.resolve(mockProfile);
    }
    if (url === "/wallet/researcher/deposits") {
      const body = opts?.body || {};
      const ref = (body.reference as string) || "";

      if (ref.startsWith("MISMATCH")) {
        const err = new Error("Transaction record amount does not match claimed deposit.");
        (err as any).status = 422;
        return Promise.reject(err);
      }

      if (body.method === "bank_transfer") {
        return Promise.resolve({
          deposit: {
            id: "dep-manual-1",
            amount_etb: body.amount_etb,
            method: body.method,
            reference: body.reference,
            status: "needs_review",
            verification_status: "unsupported_provider",
            created_at: new Date().toISOString(),
          },
          wallet: mockWallet,
          requires_manual_review: true,
          message: "Deposit queued for manual administrative review.",
        });
      }

      return Promise.resolve({
        deposit: {
          id: "dep-1",
          amount_etb: body.amount_etb,
          method: body.method,
          reference: body.reference,
          status: "completed",
          verification_status: "verified",
          created_at: new Date().toISOString(),
        },
        wallet: {
          ...mockWallet,
          available_etb: mockWallet.available_etb + Number(body.amount_etb),
        },
        verified: true,
        message: "Payment verified via verify.et.",
      });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderWalletPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ResearcherWalletPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Wallet Deposit with verify.et Reconciliation (v4 §4.6.1, §3.5, §7.4 item 12)", () => {
  it("renders deposit form with reference number and sender detail inputs", async () => {
    renderWalletPage();

    await waitFor(() => {
      expect(screen.getByText("Quick Deposit / Add Funds")).toBeDefined();
      expect(screen.getByText("verify.et Transaction Reconciliation")).toBeDefined();
      expect(screen.getByLabelText(/Transaction Reference Number/i)).toBeDefined();
      expect(screen.getByLabelText(/Sender Phone or Account Suffix/i)).toBeDefined();
      expect(screen.getByText("Telebirr")).toBeDefined();
      expect(screen.getByText(/Commercial Bank of Ethiopia/i)).toBeDefined();
    });
  });

  it("requires transaction reference number to proceed with automated verification", async () => {
    renderWalletPage();

    await waitFor(() => {
      expect(screen.getByText(/Verify & Credit Deposit/i)).toBeDefined();
    });

    const submitBtn = screen.getByText(/Verify & Credit Deposit/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter the transaction reference from your payment confirmation/i),
      ).toBeDefined();
    });
  });

  it("submits reference for automated verification and shows success banner on match", async () => {
    renderWalletPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Transaction Reference Number/i)).toBeDefined();
    });

    const refInput = screen.getByLabelText(/Transaction Reference Number/i);
    fireEvent.change(refInput, { target: { value: "FT26123490X12" } });

    const submitBtn = screen.getByText(/Verify & Credit Deposit/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Payment verified via verify.et. Your balance has been credited immediately!/i),
      ).toBeDefined();
    });
  });

  it("handles unsupported providers by queuing for manual admin review", async () => {
    renderWalletPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/Transaction Reference Number/i)).toBeDefined();
    });

    // Select Bank Transfer
    const wireRadio = screen.getByLabelText(/Other Local Bank Transfer/i);
    fireEvent.click(wireRadio);

    const refInput = screen.getByLabelText(/Transaction Reference Number/i);
    fireEvent.change(refInput, { target: { value: "WIRE-998822" } });

    const submitBtn = screen.getByText(/Verify & Credit Deposit/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Deposit queued for manual administrative review/i),
      ).toBeDefined();
    });
  });
});
