import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VerificationPage } from "./VerificationPage";
import { LanguageProvider } from "@/lib/language";

const apiMock = vi.fn().mockImplementation((url: string, _opts?: { body?: Record<string, unknown> }) => {
  if (url === "/respondents/verify/fayda") {
    return Promise.resolve({ success: true, verified: true });
  }
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

let currentUser: any = {
  id: "user-1",
  role: "respondent",
  full_name: "Abebe Bekele",
  verification_tier: "0_registered",
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

describe("Ethosk - Tier 1 Identity Verification (Stitch Screen 5501739850a0499db043b3e4d2267711)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    currentUser = {
      id: "user-1",
      role: "respondent",
      full_name: "Abebe Bekele",
      verification_tier: "0_registered",
    };
    vi.clearAllMocks();
  });

  it("renders Tier 1 Identity Verification header, demographic fields, and Fayda eSignet section", () => {
    renderWithProviders(<VerificationPage />);

    expect(screen.getByText("Tier 1 Verification: Identity Guaranteed")).toBeDefined();
    expect(screen.getByText(/Unlock premium surveys, high-value rewards/i)).toBeDefined();

    // Check Demographic inputs
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Phone Number/i)).toBeDefined();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeDefined();
    expect(screen.getByLabelText(/Gender/i)).toBeDefined();
    expect(screen.getByLabelText(/Region/i)).toBeDefined();
    expect(screen.getByLabelText(/City/i)).toBeDefined();
    expect(screen.getByLabelText(/Highest Education Level/i)).toBeDefined();
    expect(screen.getByLabelText(/Employment Status/i)).toBeDefined();

    // Check Fayda integration elements
    expect(screen.getByText("National ID Verification (Fayda)")).toBeDefined();
    expect(screen.getByLabelText(/12-Digit Fayda Identification Number/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Authorize with Fayda eSignet/i })).toBeDefined();

    // Check Physical ID photo fallback
    expect(screen.getByText("Upload physical ID photo")).toBeDefined();
    expect(screen.getByText("Drag and drop or click to browse")).toBeDefined();

    // Check Action buttons
    expect(screen.getByRole("button", { name: /Skip for now/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Submit for Verification Review/i })).toBeDefined();
    expect(screen.getByText(/Secured by Ethosk Institutional Trust Protocol/i)).toBeDefined();
  });

  it("authorizes Fayda National ID via eSignet and triggers status update", async () => {
    renderWithProviders(<VerificationPage />);

    const faydaInput = screen.getByLabelText(/12-Digit Fayda Identification Number/i);
    fireEvent.change(faydaInput, { target: { value: "123456789012" } });

    const eSignetBtn = screen.getByRole("button", { name: /Authorize with Fayda eSignet/i });
    fireEvent.click(eSignetBtn);

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/verify/fayda", expect.objectContaining({
        body: { fayda_id: "123456789012" },
      }));
    });

    await waitFor(() => {
      expect(screen.getByText("Fayda ID Verified")).toBeDefined();
    });
  });

  it("handles physical document upload and demographic submission", async () => {
    renderWithProviders(<VerificationPage />);

    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: "+251 911 334455" } });
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: "Hawassa" } });

    const file = new File(["dummy id"], "kebele_id.png", { type: "image/png" });
    const dropzone = screen.getByText("Drag and drop or click to browse");
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText("kebele_id.png")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit for Verification Review/i }));

    await waitFor(() => {
      expect(apiMock).toHaveBeenCalledWith("/respondents/profile", expect.objectContaining({
        body: expect.objectContaining({
          full_name: "Abebe Bekele",
          phone: "+251 911 334455",
          city: "Hawassa",
        }),
      }));
      expect(apiMock).toHaveBeenCalledWith("/respondents/verify-document", expect.objectContaining({
        body: expect.objectContaining({
          document_type: "kebele_id",
          file_name: "kebele_id.png",
        }),
      }));
    });
  });
});
