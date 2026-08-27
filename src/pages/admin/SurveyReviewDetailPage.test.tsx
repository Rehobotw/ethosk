import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyReviewDetailPage } from "./SurveyReviewDetailPage";
import { LanguageProvider } from "@/lib/language";

const mockSurveyDetail = {
  id: "srv-noise-1",
  title: "Impact of Urban Noise on Sleep Quality",
  researcher_name: "Sarah Jenkins",
  researcher_role: "Academic Researcher",
  research_category: "Health Sciences",
  research_purpose:
    "Investigating the correlation between ambient nighttime noise levels in Addis Ababa and reported sleep quality among adults.",
  target_audience: "500 Respondents",
  demographics: "Ages 25-45, Urban Ethiopia",
  sample_size: 500,
  budget: 25000,
  reward_per_completion: 50,
  submitted_date: "Oct 24, 2023",
  status: "pending",
  irb_approved: true,
  irb_doc_url: "https://example.com/irb_approval.pdf",
  data_privacy_tier: "Standard Tier",
  questions: [
    {
      id: "q1",
      text: "How many hours of continuous sleep do you typically get per night?",
      type: "Single Choice",
    },
    {
      id: "q2",
      text: "Rate the level of ambient noise outside your bedroom window on a typical night.",
      type: "Likert Scale",
    },
    {
      id: "q3",
      text: "What specific sounds frequently wake you up? (Select all that apply)",
      type: "Multi Choice",
    },
  ],
  history: [
    {
      title: "Submitted for Review",
      date: "Oct 24, 10:30 AM",
      user: "S. Jenkins",
    },
  ],
};

const apiMock = vi.fn().mockImplementation((url: string, opts?: { body?: Record<string, unknown> }) => {
  if (url === "/admin/surveys/srv-noise-1") {
    return Promise.resolve({ survey: mockSurveyDetail });
  }
  if (url.startsWith("/admin/survey-queue/")) {
    return Promise.resolve({ id: "srv-noise-1", status: opts?.body?.decision });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderSurveyReviewDetailPage(initialPath = "/admin/survey-approvals/srv-noise-1") {
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
              path="/admin/survey-approvals/:id"
              element={<SurveyReviewDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Admin Survey Review Detail (Stitch Screen 89fd9c83b7624eb6a062c27b0299424c)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders breadcrumbs, header, and 3-column layout components", async () => {
    renderSurveyReviewDetailPage();

    await waitFor(() => {
      // Header
      expect(screen.getByRole("heading", { name: /Impact of Urban Noise on Sleep Quality/i })).toBeDefined();
      expect(screen.getByText(/Sarah Jenkins \(Academic Researcher\) • Health Sciences/i)).toBeDefined();
      expect(screen.getByText("Oct 24, 2023")).toBeDefined();
    });

    // Overview Bento
    expect(screen.getByText("Research Purpose")).toBeDefined();
    expect(screen.getByText(/Investigating the correlation between ambient nighttime noise levels/i)).toBeDefined();
    expect(screen.getByText("500 Respondents")).toBeDefined();
    expect(screen.getByText(/25,000 ETB/i)).toBeDefined();

    // Questions instrument preview
    expect(screen.getByText("Survey Instrument Preview")).toBeDefined();
    expect(screen.getByText(/How many hours of continuous sleep do you typically get per night/i)).toBeDefined();
    expect(screen.getByText("Single Choice")).toBeDefined();
    expect(screen.getByText("Likert Scale")).toBeDefined();
    expect(screen.getByText("Multi Choice")).toBeDefined();

    // Compliance
    expect(screen.getByText("Compliance")).toBeDefined();
    expect(screen.getByText("IRB Approval")).toBeDefined();
    expect(screen.getByText("View Doc")).toBeDefined();
    expect(screen.getByText("Data Privacy")).toBeDefined();

    // Sticky Decision Card & History
    expect(screen.getByText("Review Decision")).toBeDefined();
    expect(screen.getByRole("button", { name: /Approve Survey/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Request Correction/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Reject Survey/i })).toBeDefined();
    expect(screen.getByText("Review History")).toBeDefined();
    expect(screen.getByText("Submitted for Review")).toBeDefined();
  });

  it("opens confirmation modal and executes Approve Survey action", async () => {
    renderSurveyReviewDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Approve Survey/i })).toBeDefined();
    });

    const triggerBtn = screen.getByRole("button", { name: /Approve Survey/i });
    fireEvent.click(triggerBtn);

    // Confirmation Modal should be open
    expect(screen.getByText(/Are you sure you want to approve this survey\?/i)).toBeDefined();
    expect(screen.getByText("Survey Details for Confirmation")).toBeDefined();

    const confirmBtns = screen.getAllByRole("button", { name: /Approve Survey/i });
    // Click the modal's confirm button
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-noise-1",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "passed",
          }),
        }),
      );
    });
  });

  it("opens correction modal, accepts feedback notes, and submits change request", async () => {
    renderSurveyReviewDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Request Correction/i })).toBeDefined();
    });

    const correctionBtn = screen.getByRole("button", { name: /Request Correction/i });
    fireEvent.click(correctionBtn);

    expect(screen.getByText("Request Survey Correction")).toBeDefined();
    expect(screen.getByPlaceholderText(/Describe required changes/i)).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Describe required changes/i);
    fireEvent.change(textarea, { target: { value: "Please add standard age screening questions." } });

    const sendBtn = screen.getByRole("button", { name: /Send Correction Request/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-noise-1",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "request_changes",
            notes: "Please add standard age screening questions.",
          }),
        }),
      );
    });
  });

  it("opens reject modal, selects reason, adds explanation and submits rejection", async () => {
    renderSurveyReviewDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Reject Survey/i })).toBeDefined();
    });

    const triggerBtn = screen.getByRole("button", { name: /Reject Survey/i });
    fireEvent.click(triggerBtn);

    // Reject modal should be open
    expect(screen.getByText(/This action is permanent and will notify the researcher/i)).toBeDefined();

    const select = screen.getByLabelText(/Rejection Reason/i);
    const textarea = screen.getByPlaceholderText(/Provide detailed notes on why this survey is being rejected/i);

    fireEvent.change(select, { target: { value: "Ethical Non-Compliance" } });
    fireEvent.change(textarea, {
      target: {
        value: "The participant consent forms provided do not meet the minimum requirements.",
      },
    });

    const modalSubmitBtns = screen.getAllByRole("button", { name: /Reject Survey/i });
    fireEvent.click(modalSubmitBtns[modalSubmitBtns.length - 1]);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith(
        "/admin/survey-queue/srv-noise-1",
        expect.objectContaining({
          body: expect.objectContaining({
            decision: "failed",
            reason: "Ethical Non-Compliance",
            notes: "The participant consent forms provided do not meet the minimum requirements.",
          }),
        }),
      );
    });
  });
});
