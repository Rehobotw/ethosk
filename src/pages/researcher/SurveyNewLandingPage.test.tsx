import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyNewLandingPage } from "./SurveyNewLandingPage";
import { AuthContext } from "@/lib/auth";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: vi.fn(),
  };
});

function renderPage(userOverride?: any) {
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
        <MemoryRouter initialEntries={["/survey-new"]}>
          <Routes>
            <Route path="/survey-new" element={<SurveyNewLandingPage />} />
            <Route path="/survey-builder/manual/:id" element={<div>Manual Builder Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe("SurveyNewLandingPage (REH-120: Template Survey Creation)", () => {
  it("renders creation methods and template cards", async () => {
    vi.mocked(apiModule.api).mockResolvedValue({ surveys: [] });

    renderPage();

    expect(screen.getByText("Create a survey")).toBeDefined();
    expect(screen.getByText("Manual builder")).toBeDefined();
    expect(screen.getByText("Import a questionnaire")).toBeDefined();
    expect(screen.getByText("Or start from a validated research template:")).toBeDefined();
    expect(screen.getByText("Consumer Satisfaction Baseline")).toBeDefined();
  });

  it("passes raw object payload (not double-stringified) to /surveys on template click", async () => {
    vi.mocked(apiModule.api).mockImplementation((url: string, options?: any) => {
      if (url === "/surveys" && (!options || options.method === "GET")) {
        return Promise.resolve({ surveys: [] });
      }
      if (url === "/surveys" && options?.method === "POST") {
        // Assert body is a plain object, NOT a JSON string
        expect(typeof options.body).toBe("object");
        expect(typeof options.body).not.toBe("string");
        expect(options.body.title).toBe("Consumer Satisfaction Baseline");
        expect(options.body.status).toBe("wip");
        expect(Array.isArray(options.body.questions)).toBe(true);
        return Promise.resolve({ id: "survey-tmpl-123", title: options.body.title });
      }
      return Promise.resolve({});
    });

    renderPage();

    const templateBtn = screen.getByText("Consumer Satisfaction Baseline");
    fireEvent.click(templateBtn);

    await waitFor(() => {
      expect(screen.getByText("Manual Builder Page")).toBeDefined();
    });
  });
});
