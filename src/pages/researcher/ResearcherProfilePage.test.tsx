import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ResearcherProfilePage } from "./ResearcherProfilePage";
import { AuthContext } from "@/lib/auth";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn(),
  };
});

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
      email: "researcher@addis-uni.edu.et",
      fullName: "Dr. Aster Bekele",
      role: "researcher",
      subscription_tier: "subscribed",
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
  it("submits new_password to /auth/update-password and displays success banner", async () => {
    vi.mocked(apiModule.api).mockImplementation((url: string, options?: any) => {
      if (url === "/auth/update-password") {
        expect(options?.body).toEqual({ new_password: "MySecurePassword123" });
        return Promise.resolve({ success: true, message: "Password updated successfully." });
      }
      return Promise.resolve({});
    });

    renderProfilePage();

    // Navigate to Settings tab if not already active
    const settingsTabBtn = screen.getByRole("button", { name: /Settings & Security/i });
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
