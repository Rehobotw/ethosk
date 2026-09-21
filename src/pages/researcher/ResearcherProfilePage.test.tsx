import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResearcherProfilePage } from "./ResearcherProfilePage";
import { AuthContext } from "@/lib/auth";

let mockApiCalls: Array<{ url: string; options?: any }> = [];

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string, options?: any) => {
    mockApiCalls.push({ url, options });

    if (url.includes("/researchers/profile") && (!options || options.method === "GET")) {
      return Promise.resolve({
        user_id: "res-123",
        bio: "Senior AI Researcher",
        institution: "Addis Ababa University",
        researcher_type: "academic",
        years_experience: 5,
        rating: 4.8,
        verified: true,
        verification_level: "institutional_verified",
        verification_status: "approved",
        notification_preferences: {
          email_on_response: true,
          email_on_flagged: false,
          email_on_low_balance: true,
        },
      });
    }

    if (url.includes("/researchers/profile") && options?.method === "POST") {
      return Promise.resolve({
        user_id: "res-123",
        ...options.body,
      });
    }

    if (url.includes("/wallet/researcher")) {
      return Promise.resolve({
        wallet: { available_etb: 1200 },
      });
    }

    if (url.includes("/auth/update-password") || url === "/auth/update-password") {
      return Promise.resolve({ success: true, message: "Password updated successfully." });
    }

    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderProfilePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: {
      id: "res-123",
      user_id: "res-123",
      full_name: "Dr. Abebe Bikila",
      email: "abebe@aau.edu.et",
      role: "researcher",
      subscription_tier: "free",
    },
    token: "mock-token",
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    refresh: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/profile/settings?tab=settings"]}>
          <ResearcherProfilePage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("ResearcherProfilePage (REH-121: Password Update)", () => {
  beforeEach(() => {
    mockApiCalls = [];
    vi.clearAllMocks();
  });

  it("submits new_password to /auth/update-password and displays success banner", async () => {
    renderProfilePage();

    // Navigate to Settings tab if not already active
    const settingsTabBtn = await screen.findByRole("button", { name: /Settings & Security/i });
    fireEvent.click(settingsTabBtn);

    const newPassInput = screen.getByLabelText(/New Password/i);
    const confirmPassInput = screen.getByLabelText(/Confirm Password/i);

    fireEvent.change(newPassInput, { target: { value: "MySecurePassword123" } });
    fireEvent.change(confirmPassInput, { target: { value: "MySecurePassword123" } });

    const saveBtn = screen.getByRole("button", { name: /Save New Password/i });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText("Password updated successfully.")).toBeDefined();
    });
  });
});

describe("ResearcherProfilePage - Notification Preferences (REH-136)", () => {
  beforeEach(() => {
    mockApiCalls = [];
    vi.clearAllMocks();
  });

  it("loads initial notification preferences from profile", async () => {
    renderProfilePage();

    // Switch to Settings & Security tab
    const securityTab = await screen.findByRole("button", { name: /Settings & Security/i });
    fireEvent.click(securityTab);

    // Verify Notification Preferences section is rendered
    expect(screen.getByText("Notification Preferences")).toBeDefined();
    expect(screen.getAllByText("Survey Response Notifications").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fraud Signal Alerts").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Low Balance Reminders").length).toBeGreaterThan(0);

    // Verify toggles reflect initial values (email_on_response: true, email_on_flagged: false, email_on_low_balance: true)
    const toggles = screen.getAllByRole("switch");
    expect(toggles.length).toBeGreaterThanOrEqual(3);

    expect(toggles[0]!.getAttribute("aria-checked")).toBe("true");
    expect(toggles[1]!.getAttribute("aria-checked")).toBe("false");
    expect(toggles[2]!.getAttribute("aria-checked")).toBe("true");
  });

  it("persists toggled notification preferences when clicking Save Preferences", async () => {
    renderProfilePage();

    // Switch to Settings & Security tab
    const securityTab = await screen.findByRole("button", { name: /Settings & Security/i });
    fireEvent.click(securityTab);

    // Toggle the Fraud Signal Alerts (index 1) to true
    const toggles = screen.getAllByRole("switch");
    fireEvent.click(toggles[1]!);

    // Click Save Preferences
    const saveBtn = screen.getByRole("button", { name: /Save Preferences/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      const postCalls = mockApiCalls.filter(
        (c) => c.url.includes("/researchers/profile") && c.options?.method === "POST",
      );
      expect(postCalls.length).toBeGreaterThan(0);
      const lastCall = postCalls[postCalls.length - 1]!;
      expect(lastCall.options.body.notification_preferences).toEqual({
        email_on_response: true,
        email_on_flagged: true,
        email_on_low_balance: true,
      });
    });

    expect(await screen.findByText(/Notification preferences saved successfully/i)).toBeDefined();
  });
});
