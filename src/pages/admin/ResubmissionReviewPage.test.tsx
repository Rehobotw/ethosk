import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResubmissionReviewPage } from "./ResubmissionReviewPage";
import { LanguageProvider } from "@/lib/language";
import * as apiModule from "@/lib/api";

const apiMock = vi.spyOn(apiModule, "api");

function renderResubmissionReviewPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/admin/resubmission-review/srv-8924"]}>
          <Routes>
            <Route
              path="/admin/resubmission-review/:id"
              element={<ResubmissionReviewPage />}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Resubmission Review (Stitch Screen 13605bbe317c455aa5611d113d11c4ca)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
    apiMock.mockImplementation(async (url: string) => {
      if (url.includes("/admin/resubmission-review")) {
        return {
          survey: {
            id: "srv-8924",
            survey_code: "SRV-8924",
            title: "Impact of Remote Work on Pediatric Mental Health in Urban Centers",
            researcher_name: "Dr. Sarah Jenkins",
            research_category: "Health Sciences",
            status: "Resubmitted",
            previous_version: {
              version_label: "Previous Version (V1)",
              correction_date: "Oct 12, 2023",
              correction_feedback:
                "Clarify the ethical consent process for minors. The provided document lacks specific guidelines for guardian co-signing. Also, budget justification for participant incentives is unclear.",
              doc_name: "consent_form_draft_v1.pdf",
              total_budget: 500,
              incentive_per_participant: 5,
            },
            updated_version: {
              version_label: "Updated Version (V2)",
              doc_name: "consent_form_minor_guardian_v2.pdf",
              doc_change_summary: "Added dual-signature requirement",
              researcher_note:
                "Updated the consent form to explicitly include a guardian co-signing section as requested in the previous review.",
              previous_budget: 500,
              new_budget: 750,
              previous_incentive: 5,
              new_incentive: 7.5,
            },
          },
        } as any;
      }
      return { id: "srv-8924" } as any;
    });
  });

  it("renders breadcrumbs, V1 vs V2 comparison columns, diff blocks, and action bar", async () => {
    renderResubmissionReviewPage();

    await waitFor(() => {
      // Header
      expect(screen.getByRole("heading", { name: /Survey #SRV-8924/i })).toBeDefined();
      expect(screen.getByText(/Impact of Remote Work on Pediatric Mental Health/i)).toBeDefined();
    });

    // Left column V1
    expect(screen.getByRole("heading", { name: "Previous Version (V1)" })).toBeDefined();
    expect(screen.getByText(/Clarify the ethical consent process for minors/i)).toBeDefined();
    expect(screen.getByText("consent_form_draft_v1.pdf")).toBeDefined();

    // Right column V2
    expect(screen.getByRole("heading", { name: "Updated Version (V2)" })).toBeDefined();
    expect(screen.getByText("Changes Detected")).toBeDefined();
    expect(screen.getByText("consent_form_minor_guardian_v2.pdf")).toBeDefined();
    expect(screen.getByText("Added dual-signature requirement")).toBeDefined();
    expect(
      screen.getByText(
        /"Updated the consent form to explicitly include a guardian co-signing section as requested in the previous review\."/i,
      ),
    ).toBeDefined();
    expect(screen.getByText("750 ETB")).toBeDefined();
    expect(screen.getByText("7.5 ETB")).toBeDefined();

    // Footer actions
    expect(screen.getByRole("button", { name: /Reject Survey/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Request Further Correction/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Approve Survey/i })).toBeDefined();
  });

  it("opens Approve Confirmation modal and submits approval", async () => {
    apiMock.mockResolvedValueOnce({ id: "srv-8924" });

    renderResubmissionReviewPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Approve Survey/i })).toBeDefined();
    });

    const approveBtn = screen.getByRole("button", { name: /Approve Survey/i });
    fireEvent.click(approveBtn);

    // Modal dialog
    expect(screen.getByText(/Are you sure you want to approve this survey/i)).toBeDefined();
    expect(screen.getByText("Survey Details for Confirmation")).toBeDefined();

    const confirmBtns = screen.getAllByRole("button", { name: /Approve Survey/i });
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-8924",
        expect.objectContaining({
          body: expect.objectContaining({ decision: "passed" }),
        }),
      );
    });
  });

  it("opens Reject Survey modal, fills reason and explanation, and submits rejection", async () => {
    apiMock.mockResolvedValueOnce({ id: "srv-8924" });

    renderResubmissionReviewPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Reject Survey/i })).toBeDefined();
    });

    const rejectBtn = screen.getByRole("button", { name: /Reject Survey/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByText(/This action is permanent and will notify the researcher/i)).toBeDefined();

    const select = screen.getByLabelText(/Rejection Reason/i);
    const textarea = screen.getByPlaceholderText(/Provide detailed notes on why this survey is being rejected/i);

    fireEvent.change(select, { target: { value: "Violation of Terms of Service" } });
    fireEvent.change(textarea, { target: { value: "Institutional IRB authorization was not valid." } });

    const submitBtns = screen.getAllByRole("button", { name: /Reject Survey/i });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-8924",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "failed",
            reason: "Violation of Terms of Service",
            notes: "Institutional IRB authorization was not valid.",
          }),
        }),
      );
    });
  });

  it("opens Request Further Correction modal and submits changes request", async () => {
    apiMock.mockResolvedValueOnce({ id: "srv-8924" });

    renderResubmissionReviewPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Request Further Correction/i })).toBeDefined();
    });

    const correctionBtn = screen.getByRole("button", { name: /Request Further Correction/i });
    fireEvent.click(correctionBtn);

    expect(screen.getByPlaceholderText(/Describe further required changes\.\.\./i)).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Describe further required changes\.\.\./i);
    fireEvent.change(textarea, { target: { value: "Please provide the official hospital IRB stamp." } });

    const submitBtn = screen.getByRole("button", { name: /Send Correction Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-8924",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "request_changes",
            notes: "Please provide the official hospital IRB stamp.",
          }),
        }),
      );
    });
  });
});
