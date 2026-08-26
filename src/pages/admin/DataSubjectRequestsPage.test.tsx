import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataSubjectRequestsPage } from "./DataSubjectRequestsPage";

const mockDsrData = {
  requests: [
    {
      id: "dsr-101",
      user_id: "user-1",
      user_name: "Selamawit Tadesse",
      user_email: "selam@gmail.com",
      role: "respondent",
      event_type: "data_erasure_request",
      statute: "Proclamation 1321/2024 §17.7",
      reason: "Requesting full account erasure and demographic data deletion.",
      status: "pending",
      action_taken: null,
      admin_notes: null,
      actioned_at: null,
      created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      due_by: new Date(Date.now() + 25 * 86_400_000).toISOString(),
      days_remaining: 25,
      is_urgent: false,
    },
    {
      id: "dsr-102",
      user_id: "user-2",
      user_name: "Haile Gebre",
      user_email: "haile@gmail.com",
      role: "respondent",
      event_type: "data_erasure_request",
      statute: "Proclamation 1321/2024 §17.7",
      reason: "No longer active on the platform.",
      status: "completed",
      action_taken: "complete_erasure",
      admin_notes: "Personal records anonymized",
      actioned_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
      due_by: new Date(Date.now() + 10 * 86_400_000).toISOString(),
      days_remaining: 10,
      is_urgent: false,
    },
  ],
  metrics: {
    total_requests: 2,
    pending_requests: 1,
    completed_requests: 1,
    urgent_count: 0,
    response_sla_days: 30,
  },
};

const apiMock = vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
  if (url === "/admin/data-requests") {
    return Promise.resolve(mockDsrData);
  }
  if (url.startsWith("/admin/data-requests/")) {
    const body = opts?.body || {};
    return Promise.resolve({
      id: "dsr-101",
      status: body.action === "reject" ? "rejected" : "completed",
      action_taken: body.action,
      message: "Data subject request actioned successfully",
    });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

import { beforeEach } from "vitest";
import { LanguageProvider } from "@/lib/language";

function renderDsrPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <DataSubjectRequestsPage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Data Subject Requests Admin UI (FR-ADM-2 / Proclamation 1321/2024 §17.7)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });
  it("renders statutory compliance header, SLA metrics, and request items", async () => {
    renderDsrPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Data Subject Requests/i })).toBeDefined();
      expect(screen.getAllByText("Proclamation 1321/2024 §17.7").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Selamawit Tadesse")).toBeDefined();
    });

    // Check SLA metrics
    expect(screen.getByText("Pending Actions")).toBeDefined();
    expect(screen.getByText("Statutory SLA")).toBeDefined();
    expect(screen.getByText(/25 days left/i)).toBeDefined();
  });

  it("filters requests by tab status (Pending vs Completed vs All)", async () => {
    renderDsrPage();

    await waitFor(() => {
      expect(screen.getByText("Selamawit Tadesse")).toBeDefined();
      expect(screen.queryByText("Haile Gebre")).toBeNull();
    });

    // Switch to All Requests tab
    const allTab = screen.getByRole("button", { name: /All Requests/i });
    fireEvent.click(allTab);

    await waitFor(() => {
      expect(screen.getByText("Selamawit Tadesse")).toBeDefined();
      expect(screen.getByText("Haile Gebre")).toBeDefined();
    });

    // Switch to Completed tab
    const completedTab = screen.getByRole("button", { name: /^Completed/i });
    fireEvent.click(completedTab);

    await waitFor(() => {
      expect(screen.queryByText("Selamawit Tadesse")).toBeNull();
      expect(screen.getByText("Haile Gebre")).toBeDefined();
    });
  });

  it("opens Complete Erasure modal and submits action", async () => {
    renderDsrPage();

    await waitFor(() => {
      expect(screen.getByText("Selamawit Tadesse")).toBeDefined();
    });

    const eraseBtn = screen.getByRole("button", { name: /Complete Erasure/i });
    fireEvent.click(eraseBtn);

    await waitFor(() => {
      expect(screen.getByText("Execute Data Erasure")).toBeDefined();
    });

    const submitBtn = screen.getByRole("button", { name: /Execute Erasure/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/data-requests/dsr-101",
        expect.objectContaining({
          body: expect.objectContaining({
            action: "complete_erasure",
          }),
        }),
      );
    });
  });

  it("opens Reject modal, requires justification, and submits rejection", async () => {
    renderDsrPage();

    await waitFor(() => {
      expect(screen.getByText("Selamawit Tadesse")).toBeDefined();
    });

    const rejectBtn = screen.getByRole("button", { name: /^Reject$/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(screen.getByText("Reject Data Subject Request")).toBeDefined();
    });

    const textarea = screen.getByPlaceholderText(/e\.g\. Identity could not be authenticated/i);
    fireEvent.change(textarea, { target: { value: "Identity authentication mismatch." } });

    const submitRejectBtn = screen.getByRole("button", { name: /Reject Request/i });
    fireEvent.click(submitRejectBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/data-requests/dsr-101",
        expect.objectContaining({
          body: expect.objectContaining({
            action: "reject",
            notes: "Identity authentication mismatch.",
          }),
        }),
      );
    });
  });
});
