import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDashboardOverviewPage } from "./AdminDashboardOverviewPage";
import { LanguageProvider } from "@/lib/language";

const mockOverviewData = {
  total_users: 32450,
  total_respondents: 30350,
  total_researchers: 2100,
  verified_respondents: 22700,
  tier1_count: 18200,
  tier2_count: 4500,
  active_surveys: 145,
  pending_surveys: 12,
  completed_surveys: 892,
  total_surveys: 1037,
  pending_documents: 8,
  pending_researchers: 3,
  pending_reconciliation: 2,
  total_volume_etb: 158000,
  verified_volume_etb: 146466,
  manual_volume_etb: 11534,
  gross_deposits_etb: 118500,
  gross_payouts_etb: 39500,
  reconciled_percent: 92.7,
  subscription_revenue_etb: 42000,
  commission_revenue_etb: 12500,
  recent_queue_items: [
    {
      id: "rev-1",
      user_id: "user-1",
      doc_type: "Student ID Card",
      status: "pending",
      created_at: new Date().toISOString(),
      users: {
        full_name: "Yared Haile",
        email: "yared@aau.edu.et",
        verification_tier: "1_id_verified",
      },
    },
  ],
};

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === "/admin/overview") {
      return Promise.resolve(mockOverviewData);
    }
    return Promise.resolve({});
  }),
}));

function renderOverviewPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <AdminDashboardOverviewPage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Admin Dashboard (Super) (Stitch Screen 7370a57651394e31a8e8296b6ed629e6)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders Total Transaction Volume card with verify.et reconciliation status", async () => {
    renderOverviewPage();

    await waitFor(() => {
      expect(screen.getByText("Dashboard Overview")).toBeDefined();
      expect(screen.getByText("Total Transaction Volume")).toBeDefined();
    });

    // Check volume and reconciliation badge
    expect(screen.getByText(/158,000/)).toBeDefined();
    expect(screen.getByText("92.7% Reconciled")).toBeDefined();
    expect(screen.getByText("+118,500 ETB")).toBeDefined();
    expect(screen.getByText("-39,500 ETB")).toBeDefined();
  });

  it("renders Subscription Revenue and Commission Revenue as distinct cards in Super Admin Financial section", async () => {
    renderOverviewPage();

    await waitFor(() => {
      expect(screen.getByText("Financial Dashboard (Super Admin)")).toBeDefined();
      expect(screen.getByText("Subscription Revenue")).toBeDefined();
      expect(screen.getByText("Commission Revenue")).toBeDefined();
    });

    // Check distinct revenue numbers and breakdown
    expect(screen.getByText(/Monthly MRR: 42,000 ETB/)).toBeDefined();
    expect(screen.getByText("Pro Tier")).toBeDefined();
    expect(screen.getByText("Enterprise Tier")).toBeDefined();
    expect(screen.getByText("Active Subscribers")).toBeDefined();
    expect(screen.getByText(/12,500/)).toBeDefined();
    expect(screen.getByText(/This month \(10% Survey Take\)/)).toBeDefined();
  });

  it("renders Platform Metrics 4-card grid and pending verification queue", async () => {
    renderOverviewPage();

    await waitFor(() => {
      expect(screen.getByText("Platform Metrics")).toBeDefined();
      expect(screen.getByText("Total Users")).toBeDefined();
      expect(screen.getByText("32,450")).toBeDefined();
      expect(screen.getByText("Surveys")).toBeDefined();
      expect(screen.getByText("1,037")).toBeDefined();
      expect(screen.getByText("Active Researchers")).toBeDefined();
      expect(screen.getByText("Verified Respondents")).toBeDefined();
      expect(screen.getByText("22,700")).toBeDefined();
      expect(screen.getByText(/2 transactions pending reconciliation/i)).toBeDefined();
      expect(screen.getByText("Pending Verification Queue")).toBeDefined();
      expect(screen.getByText("Yared Haile")).toBeDefined();
    });
  });
});
