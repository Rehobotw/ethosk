import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyBuilderPage } from "./SurveyBuilderPage";
import { AuthContext } from "@/lib/auth";

function renderBuilderWithUser(userOverride?: any, initialPath = "/survey-builder/manual") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: userOverride ?? {
      id: "user-1",
      full_name: "Test Researcher",
      email: "researcher@ethosk.com",
      role: "researcher",
      verification_tier: "1_id_verified",
      subscription_tier: "free",
    },
    token: "mock-token",
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    updateUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/survey-builder/manual" element={<SurveyBuilderPage />} />
            <Route path="/survey-builder/manual/:id" element={<SurveyBuilderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("SurveyBuilderPage (§4.3.2 Manual Builder Dedicated Page)", () => {
  it("renders manual builder with initial questions, Save Draft, and Save as Final Draft buttons", () => {
    renderBuilderWithUser();

    expect(screen.getByPlaceholderText("Survey Title")).toBeDefined();
    expect(screen.getByText("Save Draft")).toBeDefined();
    expect(screen.getByText("Save as Final Draft")).toBeDefined();
    expect(screen.getByText("Configure & Launch")).toBeDefined();
    expect(screen.getByTitle("Back to Survey Builder Landing")).toBeDefined();
  });

  it("AI Optimize is hidden on Free tier", () => {
    renderBuilderWithUser({
      id: "user-free",
      role: "researcher",
      subscription_tier: "free",
    });

    expect(screen.queryByTitle("AI Optimize Question Phrasing")).toBeNull();
    expect(screen.queryByText("AI Optimize")).toBeNull();
  });

  it("AI Optimize is visible on Subscribed / Pro tier", () => {
    renderBuilderWithUser({
      id: "user-pro",
      role: "researcher",
      subscription_tier: "subscribed",
    });

    const aiOptimizeBtns = screen.getAllByTitle("AI Optimize Question Phrasing");
    expect(aiOptimizeBtns.length).toBeGreaterThan(0);
    expect(aiOptimizeBtns[0]?.textContent).toContain("AI Optimize");
  });

  it("allows adding all 7 sidebar question block options (Multiple Choice, Checkbox Grid, Short Text, Long Text, Likert Scale, Voice Recording, Section Divider)", async () => {
    const { fireEvent } = await import("@testing-library/react");
    renderBuilderWithUser();

    // 1. Multiple Choice
    fireEvent.click(screen.getByRole("button", { name: /Multiple Choice/i }));
    expect(screen.getByText("Select an option")).toBeDefined();

    // 2. Checkbox Grid
    fireEvent.click(screen.getByRole("button", { name: /Checkbox Grid/i }));
    expect(screen.getByText("Select all that apply")).toBeDefined();

    // 3. Short Text
    fireEvent.click(screen.getByRole("button", { name: /Short Text/i }));
    expect(screen.getByText("Short answer response")).toBeDefined();

    // 4. Long Text
    fireEvent.click(screen.getByRole("button", { name: /Long Text/i }));
    expect(screen.getByText("Please describe your experience in detail")).toBeDefined();

    // 5. Likert Scale
    fireEvent.click(screen.getByRole("button", { name: /Likert Scale/i }));
    expect(screen.getByText("How satisfied are you with our service?")).toBeDefined();

    // 6. Voice Recording
    fireEvent.click(screen.getByRole("button", { name: /Voice Recording/i }));
    expect(screen.getByText(/Voice Recording Input/i)).toBeDefined();

    // 7. Section Divider
    fireEvent.click(screen.getByRole("button", { name: /Section Divider/i }));
    expect(screen.getByText("SECTION DIVIDER")).toBeDefined();
  });
});
