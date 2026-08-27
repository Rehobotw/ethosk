import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyPostingWizardPage } from "./SurveyPostingWizardPage";

const mockSurveys = [
  {
    id: "survey-1",
    title: "Addis Ababa Retail Perception 2026",
    status: "final_draft",
    reward_etb: 120,
    questions: [{ id: "q1", text: "Q1", type: "single_choice" }],
    created_at: new Date().toISOString(),
  },
  {
    id: "survey-2",
    title: "NGO Healthcare Access Survey",
    status: "draft",
    reward_etb: 80,
    questions: [{ id: "q1", text: "Q1", type: "single_choice" }],
    created_at: new Date().toISOString(),
  },
];

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === "/surveys") {
      return Promise.resolve({ surveys: mockSurveys });
    }
    if (url.includes("/match")) {
      return Promise.resolve({ matched_count: 3420 });
    }
    if (url.includes("/send")) {
      return Promise.resolve({ targeted_count: 200, status: "pending_review", reserved_etb: 30000 });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderPostingWizard(initialEntries = ["/survey-posting"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/survey-posting/:id" element={<SurveyPostingWizardPage />} />
          <Route path="/survey-posting" element={<SurveyPostingWizardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SurveyPostingWizardPage (§4.3.5–4.3.6 Survey Posting Flow)", () => {
  it("renders Step 1: Select Draft with search and draft cards", async () => {
    renderPostingWizard();

    expect(screen.getByText("Select a Final Draft")).toBeDefined();
    expect(screen.getByPlaceholderText(/Search final drafts/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Addis Ababa Retail Perception 2026")).toBeDefined();
      expect(screen.getByText("NGO Healthcare Access Survey")).toBeDefined();
    });
  });

  it("navigates through Step 2 (Format), Step 3 (Audience Targeting), and Step 4 (Budget & Escrow)", async () => {
    renderPostingWizard(["/survey-posting/survey-1"]);

    // Step 2: Format
    await waitFor(() => {
      expect(screen.getByText("Select Survey Format")).toBeDefined();
      expect(screen.getByText("Traditional Web Form")).toBeDefined();
      expect(screen.getByText("Conversational AI Chat")).toBeDefined();
    });

    // Advance to Step 3
    const nextBtn = screen.getByText("Next Step");
    fireEvent.click(nextBtn);

    // Step 3: Audience & Compliance
    await waitFor(() => {
      expect(screen.getByText("Audience Targeting & Ethical Compliance")).toBeDefined();
      expect(screen.getByText("Research Category & Legal Compliance")).toBeDefined();
      expect(screen.getByText("Core Demographics")).toBeDefined();
      expect(screen.getByText("Geography & Economics")).toBeDefined();
      expect(screen.getByText("Live Audience Match")).toBeDefined();
    });

    // Advance to Step 4
    const continueBtn = screen.getByText("Continue to Review");
    fireEvent.click(continueBtn);

    // Step 4: Sample & Budget
    await waitFor(() => {
      expect(screen.getByText("Sample Size & Funding")).toBeDefined();
      expect(screen.getByText("Budget Breakdown")).toBeDefined();
      expect(screen.getByText("Total Escrow Required")).toBeDefined();
      expect(screen.getByText("Confirm & Fund Escrow")).toBeDefined();
    });
  });

  it("Step 3 auto-determines compliance requirement based on declared research category (§7.4 item 1)", async () => {
    renderPostingWizard(["/survey-posting/survey-1"]);

    // Go to Step 3
    await waitFor(() => expect(screen.getByText("Next Step")).toBeDefined());
    fireEvent.click(screen.getByText("Next Step"));

    await waitFor(() => {
      expect(screen.getByText("Research Category & Legal Compliance")).toBeDefined();
      expect(screen.getByLabelText("Declared Research Category")).toBeDefined();
      // Default market_consumer is standard
      expect(screen.getByText("Standard Research Category")).toBeDefined();
    });

    // Select Health/medical studies
    const categorySelect = screen.getByLabelText("Declared Research Category") as HTMLSelectElement;
    fireEvent.change(categorySelect, { target: { value: "health_medical" } });

    await waitFor(() => {
      expect(screen.getByText(/Ethical Clearance Required: Health\/medical studies/i)).toBeDefined();
      expect(screen.getByText(/require an institutional clearance or ethical approval document/i)).toBeDefined();
      expect(screen.getByText("Upload Ethical Clearance / IRB Approval")).toBeDefined();
      expect(screen.getByText("YES")).toBeDefined();
      expect(screen.getByText("NO")).toBeDefined();
    });

    // Select Studies involving minors
    fireEvent.change(categorySelect, { target: { value: "minors" } });

    await waitFor(() => {
      expect(screen.getByText(/Ethical Clearance Required: Studies involving minors/i)).toBeDefined();
    });
  });
});
