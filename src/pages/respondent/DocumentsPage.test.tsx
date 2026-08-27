import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DocumentsPage } from "./DocumentsPage";
import { LanguageProvider } from "@/lib/language";

const apiMock = vi.fn().mockImplementation((url: string, _opts?: { body?: Record<string, unknown> }) => {
  if (url === "/respondents/profile") {
    return Promise.resolve({
      full_name: "Abebe Bekele",
      university: "Addis Ababa University",
      department: "Computer Science",
      year: 4,
    });
  }
  if (url === "/respondents/documents") {
    return Promise.resolve({
      documents: [
        {
          id: "doc-1",
          doc_type: "student_id",
          status: "passed",
          ai_notes: "AAU Student ID verified",
          created_at: new Date().toISOString(),
        },
      ],
    });
  }
  if (url === "/respondents/email/send-otp") {
    return Promise.resolve({ success: true, dev_otp: "654321" });
  }
  if (url === "/respondents/email/confirm-otp") {
    return Promise.resolve({ success: true, verified: true });
  }
  if (url === "/respondents/institutional-details") {
    return Promise.resolve({ success: true });
  }
  if (url === "/respondents/verify-document") {
    return Promise.resolve({ success: true, verification_tier: "2_attribute_verified" });
  }
  return Promise.resolve({});
});

vi.mock("@/lib/api", () => ({
  api: (...args: any[]) => apiMock(...args),
  ApiRequestError: class ApiRequestError extends Error {},
}));

let currentUser: any = {
  id: "user-1",
  role: "respondent",
  full_name: "Abebe Bekele",
  verification_tier: "1_id_verified",
};
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

describe("Ethosk - Tier 2 Academic & Institutional Verification (Stitch Screen e49cfbc0a0ae4106821581c42e8cec19)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    currentUser = {
      id: "user-1",
      role: "respondent",
      full_name: "Abebe Bekele",
      verification_tier: "1_id_verified",
    };
    vi.clearAllMocks();
  });

  it("shows gating lock when respondent has not completed Tier 1 verification", () => {
    currentUser = {
      id: "user-unverified",
      role: "respondent",
      full_name: "Unverified User",
      verification_tier: "0_registered",
    };

    renderWithProviders(<DocumentsPage />);

    expect(screen.getByText("Tier 1 Verification Required First")).toBeDefined();
    expect(screen.getByRole("button", { name: /Complete Tier 1 Verification/i })).toBeDefined();
  });

  it("renders Tier 2 verification form card with Stitch inputs and Tier 1 complete badge", async () => {
    renderWithProviders(<DocumentsPage />);

    expect(screen.getByText("Tier 2 Verification: Academic & Institutional")).toBeDefined();
    expect(screen.getByText("Tier 1 Complete")).toBeDefined();
    expect(screen.getByText(/Unlock access to specialized research panels/i)).toBeDefined();

    // 2-column grid fields
    expect(screen.getByLabelText(/Institution Type/i)).toBeDefined();
    expect(screen.getByLabelText(/Institution Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Department \/ Faculty/i)).toBeDefined();
    expect(screen.getByLabelText(/Academic Year \/ Role/i)).toBeDefined();

    // Institutional Email section
    expect(screen.getByText("Institutional Email Verification")).toBeDefined();
    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Send 6-Digit OTP/i })).toBeDefined();

    // Supporting document upload
    expect(screen.getByText("Supporting Document")).toBeDefined();
    expect(screen.getByText("Click to upload Student ID or Employee Badge")).toBeDefined();

    // Action buttons
    expect(screen.getByRole("button", { name: /Skip for now/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Submit Tier 2 Credentials/i })).toBeDefined();

    // Document History status
    await waitFor(() => {
      expect(screen.getByText("Document Verification Status")).toBeDefined();
      expect(screen.getByText("Student ID Card")).toBeDefined();
    });
  });

  it("sends institutional email OTP and auto-confirms upon 6-digit entry", async () => {
    renderWithProviders(<DocumentsPage />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: "abebe@aau.edu.et" } });

    const sendOtpBtn = screen.getByRole("button", { name: /Send 6-Digit OTP/i });
    fireEvent.click(sendOtpBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/email/send-otp", expect.objectContaining({
        body: { email: "abebe@aau.edu.et" },
      }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Enter Verification Code/i)).toBeDefined();
    });

    // Enter 6 OTP digits
    const digits = ["6", "5", "4", "3", "2", "1"];
    for (let i = 0; i < 6; i++) {
      const digitInput = document.getElementById(`otp-digit-${i}`);
      if (digitInput) {
        fireEvent.change(digitInput, { target: { value: digits[i] } });
      }
    }

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/email/confirm-otp", expect.objectContaining({
        body: { email: "abebe@aau.edu.et", code: "654321" },
      }));
    });

    await waitFor(() => {
      expect(screen.getByText("Email Verified")).toBeDefined();
    });
  });
});
