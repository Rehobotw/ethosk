import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RejectSurveyModal } from "./RejectSurveyModal";
import { LanguageProvider } from "@/lib/language";

const mockSurvey = {
  id: "srv-noise-1",
  title: "Impact of Urban Noise on Sleep Quality",
  researcher_name: "Sarah Jenkins",
};

describe("Ethosk - Reject Survey Modal (Stitch Screen 5fb2ab1086804ebabbd6cb0fb368a540)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders warning alert, target survey info, reason dropdown, explanation textarea and actions", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <LanguageProvider>
        <RejectSurveyModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          survey={mockSurvey}
        />
      </LanguageProvider>,
    );

    // Header
    expect(screen.getByRole("heading", { name: /Reject Survey/i })).toBeDefined();

    // Warning Alert
    expect(
      screen.getByText(
        /This action is permanent and will notify the researcher that their study has been rejected\./i,
      ),
    ).toBeDefined();

    // Target survey details
    expect(screen.getByText("Target Survey")).toBeDefined();
    expect(screen.getByText(/'Impact of Urban Noise on Sleep Quality'/i)).toBeDefined();
    expect(screen.getByText(/by Sarah Jenkins/i)).toBeDefined();

    // Form inputs
    const select = screen.getByLabelText(/Rejection Reason/i);
    const textarea = screen.getByPlaceholderText(/Provide detailed notes on why this survey is being rejected/i);
    const submitBtn = screen.getByRole("button", { name: /Reject Survey/i });
    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });

    expect(select).toBeDefined();
    expect(textarea).toBeDefined();
    expect(submitBtn).toBeDefined();

    // Cancel interaction
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Form fill & submission
    fireEvent.change(select, { target: { value: "Ethical Non-Compliance" } });
    fireEvent.change(textarea, {
      target: {
        value: "The participant consent forms provided do not meet the minimum requirements.",
      },
    });

    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      reason: "Ethical Non-Compliance",
      explanation: "The participant consent forms provided do not meet the minimum requirements.",
    });
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <LanguageProvider>
        <RejectSurveyModal
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
