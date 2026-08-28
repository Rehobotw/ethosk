import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReconciliationQueuePage } from "./ReconciliationQueuePage";

const mockReconciliationData = {
  items: [
    {
      id: "dep-101",
      type: "deposit",
      user_id: "res-user-1",
      user_name: "Dr. Almaz Kebede",
      user_email: "almaz@aau.edu.et",
      role: "researcher",
      amount_etb: 15000,
      provider: "cbe",
      reference: "CBE-TX-998811",
      provider_ref: null,
      claimed_detail: "CBE Ref 998811 from Almaz K.",
      status: "needs_review",
      verification_status: "unsupported_provider",
      verification_notes: "The payment method 'cbe' is not automated via verify.et and has been queued for manual administrative reconciliation.",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "pay-202",
      type: "payout",
      user_id: "resp-user-2",
      user_name: "Dawit Bekele",
      user_email: "dawit@gmail.com",
      role: "respondent",
      amount_etb: 350,
      provider: "telebirr",
      reference: "WD-TLB-7722",
      provider_ref: null,
      claimed_detail: "0911223344",
      status: "needs_review",
      verification_status: "manual_review",
      verification_notes: "Pending manual admin reconciliation",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  metrics: {
    total_needs_review: 2,
    total_deposits: 1,
    total_payouts: 1,
    total_transactions: 12,
    unsupported_share_percent: 16.7,
    flag_volume_alert: true,
  },
};

const apiMock = vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
  if (url === "/admin/reconciliation-queue") {
    return Promise.resolve(mockReconciliationData);
  }
  if (url.startsWith("/admin/reconciliation-queue/")) {
    const body = opts?.body || {};
    return Promise.resolve({
      id: "dep-101",
      type: body.type,
      decision: body.decision,
      message: "Action processed successfully",
    });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderReconciliationQueue() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ReconciliationQueuePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Manual Admin Reconciliation Queue (Spec v4 §8 Known Gaps, §4.6.1, REH-113 & REH-114)", () => {
  it("renders reconciliation queue items and pilot volume monitoring banner", async () => {
    renderReconciliationQueue();

    await waitFor(() => {
      expect(screen.getByText("Transaction Reconciliation Queue")).toBeDefined();
      expect(screen.getByText("v4 §8 Fallback")).toBeDefined();
    });

    // Check items rendered
    expect(screen.getByText("Dr. Almaz Kebede")).toBeDefined();
    expect(screen.getByText("#CBE-TX-998811")).toBeDefined();
    expect(screen.getByText("+15,000 ETB")).toBeDefined();
    expect(screen.getByText("Dawit Bekele")).toBeDefined();
    expect(screen.getByText("#WD-TLB-7722")).toBeDefined();
    expect(screen.getByText("-350 ETB")).toBeDefined();

    // Check Pilot Volume Monitor alert
    expect(screen.getByText("Pilot Volume Monitor")).toBeDefined();
    expect(screen.getByText(/Elevated manual volume/i)).toBeDefined();
    expect(screen.getByText("16.7%")).toBeDefined();
  });

  it("filters items by type (Deposits vs Payouts)", async () => {
    renderReconciliationQueue();

    await waitFor(() => {
      expect(screen.getByText("Dr. Almaz Kebede")).toBeDefined();
      expect(screen.getByText("Dawit Bekele")).toBeDefined();
    });

    // Click Deposits filter tab
    const depositsTab = screen.getByRole("button", { name: /Deposits/i });
    fireEvent.click(depositsTab);

    await waitFor(() => {
      expect(screen.getByText("Dr. Almaz Kebede")).toBeDefined();
      expect(screen.queryByText("Dawit Bekele")).toBeNull();
    });

    // Click Payouts filter tab
    const payoutsTab = screen.getByRole("button", { name: /Payouts/i });
    fireEvent.click(payoutsTab);

    await waitFor(() => {
      expect(screen.queryByText("Dr. Almaz Kebede")).toBeNull();
      expect(screen.getByText("Dawit Bekele")).toBeDefined();
    });
  });

  it("opens confirm modal and submits manual confirmation", async () => {
    renderReconciliationQueue();

    await waitFor(() => {
      expect(screen.getByText("Dr. Almaz Kebede")).toBeDefined();
    });

    const confirmButtons = screen.getAllByRole("button", { name: /^Confirm/i });
    fireEvent.click(confirmButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Manually Confirm Deposit/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/e\.g\. CBE-TX-99881122/i)).toBeDefined();
    });

    const advanceBtn = screen.getByRole("button", { name: /Confirm & Advance/i });
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/reconciliation-queue/dep-101",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "deposit",
            decision: "confirm",
          }),
        }),
      );
    });
  });

  it("opens reject modal, requires reason, and submits manual rejection", async () => {
    renderReconciliationQueue();

    await waitFor(() => {
      expect(screen.getByText("Dr. Almaz Kebede")).toBeDefined();
    });

    const rejectButtons = screen.getAllByRole("button", { name: /^Reject/i });
    fireEvent.click(rejectButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText(/Reject Deposit/i)).toBeDefined();
    });

    const textarea = screen.getByPlaceholderText(/e\.g\. Bank reference not found/i);
    fireEvent.change(textarea, { target: { value: "Reference number not found on bank statement." } });

    const submitRejectBtn = screen.getByRole("button", { name: /Reject Transaction/i });
    fireEvent.click(submitRejectBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/reconciliation-queue/dep-101",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "deposit",
            decision: "reject",
            notes: "Reference number not found on bank statement.",
          }),
        }),
      );
    });
  });
});
