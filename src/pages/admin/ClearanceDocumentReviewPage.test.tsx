import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClearanceDocumentReviewPage } from "./ClearanceDocumentReviewPage";
import { LanguageProvider } from "@/lib/language";

const mockDocDetail = {
  id: "doc-irb-2023",
  survey_id: "srv-urban-noise",
  survey_title: "Impact of Urban Noise on Sleep Quality",
  document_type: "Institutional Review Board (IRB) Approval",
  research_category: "Social & Behavioral Sciences",
  uploaded_by: {
    full_name: "Sarah Jenkins",
    email: "s.jenkins@example.edu",
    avatar_initials: "SJ",
  },
  upload_timestamp: "Oct 12, 2023, 14:32:05 UTC",
  filename: "IRB_Jenkins_2023_v2.pdf",
  filesize: "4.2 MB",
  preview_url: "https://example.com/irb_jenkins_2023.pdf",
  status: "under_review",
};

const apiMock = vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
  if (url === "/admin/clearance-docs/doc-irb-2023") {
    return Promise.resolve({ doc: mockDocDetail });
  }
  if (url.startsWith("/admin/clearance-docs/doc-irb-2023/decision")) {
    return Promise.resolve({ id: "doc-irb-2023", status: opts?.body?.decision });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderClearanceDocumentReviewPage(initialPath = "/admin/compliance-docs/doc-irb-2023") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              path="/admin/compliance-docs/:id"
              element={<ClearanceDocumentReviewPage />}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Approval / Clearance Document Review (Stitch Screen e0cab0f7836e43b8a7ddf8650daa3a64)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders breadcrumbs, return link, header badges, document preview and metadata", async () => {
    renderClearanceDocumentReviewPage();

    await waitFor(() => {
      // Header and title
      expect(screen.getByRole("heading", { name: /Impact of Urban Noise on Sleep Quality/i })).toBeDefined();
      expect(screen.getByText("Under Review")).toBeDefined();
      expect(screen.getByText("IRB Ethical Clearance")).toBeDefined();
      expect(screen.getByText(/Submitted by/i)).toBeDefined();
      expect(screen.getAllByText("Sarah Jenkins").length).toBeGreaterThanOrEqual(1);
    });

    // Return button & Breadcrumbs
    expect(screen.getByText("Return to Survey Review")).toBeDefined();
    expect(screen.getByText("Document Review")).toBeDefined();

    // Document Preview
    expect(screen.getByText("Document Preview")).toBeDefined();
    expect(screen.getByText("IRB_Jenkins_2023_v2.pdf")).toBeDefined();
    expect(screen.getByText(/4.2 MB • Uploaded Oct 12, 2023, 14:32:05 UTC/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Open Viewer/i })).toBeDefined();

    // Document Metadata
    expect(screen.getByText("Document Metadata")).toBeDefined();
    expect(screen.getByText("Institutional Review Board (IRB) Approval")).toBeDefined();
    expect(screen.getByText("Social & Behavioral Sciences")).toBeDefined();

    // Reviewer Notes & Decision Card
    expect(screen.getByLabelText(/Reviewer Notes \(Internal\)/i)).toBeDefined();
    expect(screen.getByText(/Critical Reminder:/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Accept Document/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Request Replacement/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Reject Document/i })).toBeDefined();
  });

  it("executes Accept Document action", async () => {
    renderClearanceDocumentReviewPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Accept Document/i })).toBeDefined();
    });

    const acceptBtn = screen.getByRole("button", { name: /Accept Document/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/clearance-docs/doc-irb-2023/decision",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "approved",
          }),
        }),
      );
    });
  });

  it("opens request replacement modal, accepts instructions, and sends request", async () => {
    renderClearanceDocumentReviewPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Request Replacement/i })).toBeDefined();
    });

    const requestBtn = screen.getByRole("button", { name: /Request Replacement/i });
    fireEvent.click(requestBtn);

    expect(screen.getByText("Request Document Replacement")).toBeDefined();
    expect(screen.getByPlaceholderText(/missing authorized institutional signatures/i)).toBeDefined();

    const textarea = screen.getByPlaceholderText(/missing authorized institutional signatures/i);
    fireEvent.change(textarea, { target: { value: "IRB approval document stamp is missing page 2 signature." } });

    const sendBtn = screen.getByRole("button", { name: /Send Replacement Request/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/clearance-docs/doc-irb-2023/decision",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "replacement_requested",
            notes: "IRB approval document stamp is missing page 2 signature.",
          }),
        }),
      );
    });
  });

  it("toggles fullscreen document viewer modal", async () => {
    renderClearanceDocumentReviewPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Open Viewer/i })).toBeDefined();
    });

    const openViewerBtn = screen.getByRole("button", { name: /Open Viewer/i });
    fireEvent.click(openViewerBtn);

    expect(screen.getByRole("button", { name: /Close Viewer/i })).toBeDefined();

    const closeBtn = screen.getByRole("button", { name: /Close Viewer/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("button", { name: /Close Viewer/i })).toBeNull();
  });
});
