import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentReviewChecklist } from "./DocumentReviewChecklist";
import { LanguageProvider } from "@/lib/language";

function renderChecklist(props: Partial<React.ComponentProps<typeof DocumentReviewChecklist>> = {}) {
  const defaultProps = {
    documentTitle: "Health Survey IRB Clearance",
    previewUrl: "https://example.com/doc.jpg",
    researchCategory: "medical_health",
    onSubmitDecision: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <LanguageProvider>
        <DocumentReviewChecklist {...defaultProps} />
      </LanguageProvider>,
    ),
    onSubmitDecision: defaultProps.onSubmitDecision,
  };
}

describe("DocumentReviewChecklist (Spec v4 §7.4 item 3, §5, §6.3)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders all 4 finalized document review checklist criteria", () => {
    renderChecklist();

    expect(screen.getByText(/4-Point Document Review Checklist/i)).toBeDefined();
    expect(screen.getByText("1. Relevance")).toBeDefined();
    expect(screen.getByText("2. Apparent Authenticity")).toBeDefined();
    expect(screen.getByText("3. Study-Category Alignment")).toBeDefined();
    expect(screen.getByText("4. Completeness & Expiry")).toBeDefined();

    // Initial state: 0/4 verified
    expect(screen.getByText("0/4 Verified")).toBeDefined();

    // Approve button disabled when not all 4 verified
    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    expect(approveBtn.hasAttribute("disabled")).toBe(true);
  });

  it("enables Approve when all 4 checklist points are checked (Check All)", () => {
    const { onSubmitDecision } = renderChecklist();

    const checkAllBtn = screen.getByRole("button", { name: /Check All/i });
    fireEvent.click(checkAllBtn);

    expect(screen.getByText("4/4 Verified")).toBeDefined();

    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    expect(approveBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(approveBtn);

    // Confirm approval form opens
    expect(screen.getByText("Confirm Approval")).toBeDefined();

    const submitBtn = screen.getByRole("button", { name: /Submit Approval/i });
    fireEvent.click(submitBtn);

    expect(onSubmitDecision).toHaveBeenCalledWith({
      decision: "passed",
      checklist: {
        relevance: true,
        apparent_authenticity: true,
        category_alignment: true,
        completeness_expiry: true,
      },
      notes: undefined,
    });
  });

  it("allows Request Correction and requires explanation of missing items", async () => {
    const { onSubmitDecision } = renderChecklist();

    // Check only item 1 and 2 (failing category alignment and completeness)
    const relevanceCheckbox = screen.getByLabelText("1. Relevance");
    const authenticityCheckbox = screen.getByLabelText("2. Apparent Authenticity");

    fireEvent.click(relevanceCheckbox);
    fireEvent.click(authenticityCheckbox);

    expect(screen.getByText("2/4 Verified")).toBeDefined();

    const requestCorrectionBtn = screen.getByRole("button", { name: /Request Correction/i });
    fireEvent.click(requestCorrectionBtn);

    expect(screen.getByText("Request Documents / Correction")).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Please provide page 2 of the IRB clearance/i);
    fireEvent.change(textarea, { target: { value: "IRB approval expired in 2025. Please provide renewed clearance." } });

    const submitBtn = screen.getByRole("button", { name: /Send Correction Request/i });
    fireEvent.click(submitBtn);

    expect(onSubmitDecision).toHaveBeenCalledWith({
      decision: "request_changes",
      checklist: {
        relevance: true,
        apparent_authenticity: true,
        category_alignment: false,
        completeness_expiry: false,
      },
      notes: "IRB approval expired in 2025. Please provide renewed clearance.",
    });
  });

  it("allows Rejection and passes checklist breakdown with reason", () => {
    const { onSubmitDecision } = renderChecklist();

    const rejectBtn = screen.getByRole("button", { name: /Reject/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByText("Reject Document & Submission")).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Institutional letterhead is missing/i);
    fireEvent.change(textarea, { target: { value: "Document is unreadable and missing official seal." } });

    const submitRejectBtn = screen.getByRole("button", { name: /Confirm Rejection/i });
    fireEvent.click(submitRejectBtn);

    expect(onSubmitDecision).toHaveBeenCalledWith({
      decision: "failed",
      checklist: {
        relevance: false,
        apparent_authenticity: false,
        category_alignment: false,
        completeness_expiry: false,
      },
      notes: "Document is unreadable and missing official seal.",
    });
  });
});
