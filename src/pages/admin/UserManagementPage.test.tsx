import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserManagementPage } from "./UserManagementPage";
import { LanguageProvider } from "@/lib/language";

const mockUsers = [
  {
    id: "user-1",
    role: "respondent",
    full_name: "Alexus Liang",
    email: "a.liang@example.com",
    email_verified: true,
    verification_tier: "1_id_verified",
    created_at: new Date().toISOString(),
    is_banned: false,
  },
  {
    id: "user-2",
    role: "researcher",
    full_name: "David Torres",
    email: "dtorres.88@example.com",
    email_verified: true,
    verification_tier: "0_registered",
    created_at: new Date().toISOString(),
    is_banned: true,
  },
];

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((_url: string) => {
    return Promise.resolve({ users: mockUsers, total: 2 });
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: {
      id: "admin-super",
      role: "admin",
      full_name: "Super Admin",
    },
  }),
}));

function renderUserManagementPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter>
          <UserManagementPage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Admin User Management (Stitch Screen 776a931d20c246b68d33d2883d889148)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
  });

  it("renders page header with SUPER ADMIN badge and Administrator Oversight section", () => {
    renderUserManagementPage();

    expect(screen.getByText("User Management")).toBeDefined();
    expect(screen.getByText("SUPER ADMIN")).toBeDefined();
    expect(screen.getByText("Administrator Oversight")).toBeDefined();
    expect(screen.getByRole("button", { name: /Provision Admin/i })).toBeDefined();

    // Admin profile cards & summary
    expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    expect(screen.getByText("Marcus Reid")).toBeDefined();
    expect(screen.getByText("2 / 6")).toBeDefined();
    expect(screen.getByText("Super Admins Active")).toBeDefined();
  });

  it("renders User Directory with search, filters, export button and table rows", async () => {
    renderUserManagementPage();

    await waitFor(() => {
      expect(screen.getByText("Alexus Liang")).toBeDefined();
    });

    expect(screen.getByText("User Directory")).toBeDefined();
    expect(screen.getByPlaceholderText(/Search users by name/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Export/i })).toBeDefined();
    expect(screen.getByText("David Torres")).toBeDefined();
    expect(screen.getAllByText("Suspended").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
  });

  it("opens Provision Admin modal when button is clicked", () => {
    renderUserManagementPage();

    const provisionBtn = screen.getByRole("button", { name: /Provision Admin/i });
    fireEvent.click(provisionBtn);

    expect(screen.getByText("Provision Platform Administrator")).toBeDefined();
    expect(screen.getByRole("button", { name: /Grant Admin Access/i })).toBeDefined();
  });
});
