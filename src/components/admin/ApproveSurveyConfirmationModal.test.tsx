import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApproveSurveyConfirmationModal } from "./ApproveSurveyConfirmationModal";
import { LanguageProvider } from "@/lib/language";

const mockSurvey = {
  id: "srv-noise-1",
  title: "Impact of Urban Noise on Sleep Quality",
  researcher_name: "Sarah Jenkins",
  research_category: "Health Sciences",
  current_status: "Pending Review",
  document_status: "Accepted" as const,
};

describe("Ethosk - Approve Survey Confirmation Modal (Stitch Screen 66601c7feee045ab92e08a138b891f2e)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders modal dialog, warning message box, survey details confirmation table, and actions", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <LanguageProvider>
        <ApproveSurveyConfirmationModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          survey={mockSurvey}
        />
      </LanguageProvider>,
    );

    // Modal Header
    expect(screen.getByRole("heading", { name: "Approve Survey" })).toBeDefined();

    // Warning confirmation message
    expect(
      screen.getByText(/Are you sure you want to approve this survey\? Once approved, it will be immediately available/i),
    ).toBeDefined();

    // Survey Details for Confirmation
    expect(screen.getByText("Survey Details for Confirmation")).toBeDefined();
    expect(screen.getByText("Impact of Urban Noise on Sleep Quality")).toBeDefined();
    expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    expect(screen.getByText("Health Sciences")).toBeDefined();
    expect(screen.getByText("Pending Review")).toBeDefined();
    expect(screen.getByText("Accepted")).toBeDefined();

    // Action buttons
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    const approveBtn = screen.getByRole("button", { name: /Approve Survey/i });

    expect(cancelBtn).toBeDefined();
    expect(approveBtn).toBeDefined();

    // Interactions
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(approveBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <LanguageProvider>
        <ApproveSurveyConfirmationModal
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          survey={mockSurvey}
        />
      </LanguageProvider>,
    );

    expect(container.firstChild).toBeNull();
  });
});
