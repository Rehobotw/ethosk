import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RespondentOnboardingPage } from "./RespondentOnboardingPage";
import { LanguageProvider } from "@/lib/language";

const apiMock = vi.fn().mockImplementation((url: string, _opts?: { body?: Record<string, unknown> }) => {
  if (url === "/respondents/profile") {
    return Promise.resolve({ success: true });
  }
  if (url === "/respondents/verify-document") {
    return Promise.resolve({ success: true, verification_tier: "1_id_verified" });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

let currentUser: any = { id: "user-1", role: "respondent", full_name: "Abebe Kebede", verification_tier: "0_registered" };
const mockRefresh = vi.fn();

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: currentUser,
    refresh: mockRefresh,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
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
          {ui}
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Respondent Onboarding Step 2 (Stitch Screen f808a06145cc432cb89ea9c97f2a3611)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    currentUser = { id: "user-1", role: "respondent", full_name: "Abebe Kebede", verification_tier: "0_registered" };
    vi.clearAllMocks();
  });

  it("renders Step 2 profile setup form with all Stitch inputs", () => {
    renderWithProviders(<RespondentOnboardingPage />);

    expect(screen.getByText("Step 2 of 4")).toBeDefined();
    expect(screen.getByText("One quick check before you start earning.")).toBeDefined();
    expect(screen.getByText("Profile completion requires a quick information review.")).toBeDefined();

    // Check all form field labels
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Phone Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeDefined();
    expect(screen.getByLabelText(/Gender/i)).toBeDefined();
    expect(screen.getByLabelText(/Region \/ City/i)).toBeDefined();
    expect(screen.getByLabelText(/Education Level/i)).toBeDefined();
    expect(screen.getByLabelText(/Employment Status/i)).toBeDefined();

    // Continue button
    expect(screen.getByRole("button", { name: /Continue/i })).toBeDefined();
  });

  it("submits profile demographic information and transitions to Step 3 (ID consistency upload)", async () => {
    renderWithProviders(<RespondentOnboardingPage />);

    // Fill in demographic inputs
    fireEvent.change(screen.getByLabelText(/Full Legal Name/i), { target: { value: "Abebe Kebede" } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "+251 911 223344" } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: "05/12/1996" } });
    fireEvent.change(screen.getByLabelText(/Gender/i), { target: { value: "male" } });
    fireEvent.change(screen.getByLabelText(/Region \/ City/i), { target: { value: "Addis Ababa" } });
    fireEvent.change(screen.getByLabelText(/Education Level/i), { target: { value: "bachelors" } });
    fireEvent.change(screen.getByLabelText(/Employment Status/i), { target: { value: "employed_full" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/profile", expect.objectContaining({
        body: expect.objectContaining({
          full_name: "Abebe Kebede",
          phone: "+251 911 223344",
          dob: "05/12/1996",
          gender: "male",
          region: "Addis Ababa",
          education_level: "bachelors",
          employment_status: "employed_full",
        }),
      }));
    });

    // Step 3 is rendered
    await waitFor(() => {
      expect(screen.getAllByText("Step 3 of 4").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Submit your ID for consistency check")).toBeDefined();
      expect(screen.getByText("Please provide a clear photo of your government-issued ID.")).toBeDefined();
      expect(screen.getByText("Tips for a successful check")).toBeDefined();
      expect(screen.getByText("Well-lit environment")).toBeDefined();
      expect(screen.getByText("All 4 corners visible")).toBeDefined();
      expect(screen.getByText("No glare or reflections")).toBeDefined();
      expect(screen.getByRole("button", { name: /Submit for review/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Skip for now/i })).toBeDefined();
    });
  });

  it("handles Step 3 ID upload and document submission", async () => {
    renderWithProviders(<RespondentOnboardingPage />);

    // Fast-forward to Step 3
    fireEvent.change(screen.getByLabelText(/Full Legal Name/i), { target: { value: "Abebe Kebede" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText("Submit your ID for consistency check")).toBeDefined();
    });

    // Upload mock file
    const file = new File(["dummy content"], "kebele_id.png", { type: "image/png" });
    const dropzone = screen.getByText("Click to upload or drag and drop");
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText("kebele_id.png")).toBeDefined();
    });

    // Click submit review -> transitions to Step 4 (Success)
    fireEvent.click(screen.getByRole("button", { name: /Submit for review/i }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/verify-document", expect.objectContaining({
        body: expect.objectContaining({
          document_type: "student_id",
          file_name: "kebele_id.png",
        }),
      }));
    });

    // Step 4 (Success Minimalist) is rendered
    await waitFor(() => {
      expect(screen.getByText("You're all set")).toBeDefined();
      expect(screen.getByText("Start exploring surveys and earning")).toBeDefined();
      expect(screen.getByRole("button", { name: /Browse surveys/i })).toBeDefined();
    });
  });

  it("renders Step 4 Success Minimalist screen when user is already verified", () => {
    currentUser = { id: "user-2", role: "respondent", full_name: "Tigist Alemu", verification_tier: "1_id_verified" };

    renderWithProviders(<RespondentOnboardingPage />);

    // Initial render with verified user lands on Step 4
    expect(screen.getByText("You're all set")).toBeDefined();
    expect(screen.getByRole("button", { name: /Browse surveys/i })).toBeDefined();
  });
});
