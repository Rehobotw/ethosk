import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DashboardRedirect } from "./DashboardRedirect";
import { AuthContext } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

function createMockAuth(overrides: {
  user?: SessionUser | null;
  loading?: boolean;
}) {
  return {
    user: overrides.user ?? null,
    loading: overrides.loading ?? false,
    login: vi.fn(),
    signup: vi.fn(),
    verifyEmail: vi.fn(),
    resendCode: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  };
}

function renderDashboardRedirect(authValue: ReturnType<typeof createMockAuth>) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/researcher" element={<div>Researcher Dashboard</div>} />
          <Route path="/inbox" element={<div>Respondent Inbox</div>} />
          <Route path="/admin/review-queue" element={<div>Admin Review Queue</div>} />
          <Route path="/admin" element={<div>Super Admin Overview</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("DashboardRedirect (REH-125)", () => {
  it("displays loading block while checking session", () => {
    const auth = createMockAuth({ loading: true, user: null });
    renderDashboardRedirect(auth);
    expect(screen.getByText(/Redirecting to your dashboard/i)).toBeDefined();
  });

  it("redirects unauthenticated users to /login", () => {
    const auth = createMockAuth({ loading: false, user: null });
    renderDashboardRedirect(auth);
    expect(screen.getByText("Login Page")).toBeDefined();
  });

  it("redirects researcher to /researcher", () => {
    const auth = createMockAuth({
      loading: false,
      user: {
        user_id: "u1",
        role: "researcher",
        verification_tier: "tier_1",
        full_name: "Dr. Aster",
        email: "aster@university.edu.et",
      },
    });
    renderDashboardRedirect(auth);
    expect(screen.getByText("Researcher Dashboard")).toBeDefined();
  });

  it("redirects respondent to /inbox", () => {
    const auth = createMockAuth({
      loading: false,
      user: {
        user_id: "u2",
        role: "respondent",
        verification_tier: "tier_1",
        full_name: "Abebe B.",
        email: "abebe@gmail.com",
      },
    });
    renderDashboardRedirect(auth);
    expect(screen.getByText("Respondent Inbox")).toBeDefined();
  });

  it("redirects admin to /admin/review-queue", () => {
    const auth = createMockAuth({
      loading: false,
      user: {
        user_id: "u3",
        role: "admin",
        verification_tier: "tier_2",
        full_name: "Admin User",
        email: "admin@ethosk.com",
      },
    });
    renderDashboardRedirect(auth);
    expect(screen.getByText("Admin Review Queue")).toBeDefined();
  });

  it("redirects super_admin to /admin", () => {
    const auth = createMockAuth({
      loading: false,
      user: {
        user_id: "u4",
        role: "super_admin",
        verification_tier: "tier_2",
        full_name: "Super Admin",
        email: "superadmin@ethosk.com",
      },
    });
    renderDashboardRedirect(auth);
    expect(screen.getByText("Super Admin Overview")).toBeDefined();
  });
});
