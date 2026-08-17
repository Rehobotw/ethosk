import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyAiPage } from "./SurveyAiPage";
import { AuthContext } from "@/lib/auth";

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url.includes("/ai-generate")) {
      return Promise.resolve({
        title: "Consumer Mobile Banking Study",
        description: "Assessing mobile wallet adoption in urban Ethiopia",
        questions: [
          {
            text: "How often do you make mobile money transfers?",
            type: "single_choice",
            options: ["Daily", "Weekly", "Monthly"],
          },
          {
            text: "What is your main barrier to using digital payments?",
            type: "text",
          },
        ],
      });
    }
    return Promise.resolve({ id: "survey-ai-1" });
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderAiPageWithUser(userOverride?: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: userOverride ?? {
      id: "res-1",
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
        <MemoryRouter>
          <SurveyAiPage />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("SurveyAiPage (§4.3.4 AI Survey Generator Dedicated Page)", () => {
  it("shows upgrade prompt for Free tier researchers", () => {
    renderAiPageWithUser({
      id: "res-free",
      role: "researcher",
      subscription_tier: "free",
    });

    expect(screen.getByText("Upgrade to Access AI Survey Generator")).toBeDefined();
    expect(screen.getByText("Upgrade to Pro")).toBeDefined();
    expect(screen.getByText("Back to Creation Hub")).toBeDefined();
  });

  it("renders topic input, question count selector, and generate button for subscribed tier", () => {
    renderAiPageWithUser();

    expect(screen.getByText("AI Survey Generator")).toBeDefined();
    expect(screen.getByPlaceholderText(/Assessing consumer adoption/i)).toBeDefined();
    expect(screen.getByText("Generate Survey Draft")).toBeDefined();
    expect(screen.getByText("Target Question Count")).toBeDefined();
  });

  it("generates survey draft and allows reviewing questions and saving", async () => {
    renderAiPageWithUser();

    const topicInput = screen.getByPlaceholderText(/Assessing consumer adoption/i);
    fireEvent.change(topicInput, { target: { value: "Mobile banking adoption study" } });

    const generateBtn = screen.getByText("Generate Survey Draft");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Consumer Mobile Banking Study")).toBeDefined();
      expect(screen.getByDisplayValue("How often do you make mobile money transfers?")).toBeDefined();
      expect(screen.getByDisplayValue("What is your main barrier to using digital payments?")).toBeDefined();
    });

    // Save buttons appear
    expect(screen.getByText("Save Draft (WIP)")).toBeDefined();
    expect(screen.getByText("Save as Final Draft")).toBeDefined();
  });
});
