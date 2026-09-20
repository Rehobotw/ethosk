import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/language";
import { AuthContext } from "@/lib/auth";
import { DashboardPage } from "./DashboardPage";
import { SurveyListPage } from "./SurveyListPage";
import { SurveyNewLandingPage } from "./SurveyNewLandingPage";

vi.mock("@/lib/api", () => ({
  api: vi.fn().mockImplementation((url: string) => {
    if (url === "/surveys") {
      return Promise.resolve({
        surveys: [
          {
            id: "study-1",
            title: "Ethiopian Consumer Purchase Patterns",
            status: "active",
            created_at: "2026-08-20T10:00:00Z",
            response_count: 45,
            targeted_count: 100,
            questions: [{ id: "q1", text: "Q1", type: "single_choice" }],
          },
          {
            id: "study-2",
            title: "Draft Healthcare Survey",
            status: "wip",
            created_at: "2026-08-22T10:00:00Z",
            response_count: 0,
            targeted_count: 50,
            questions: [{ id: "q1", text: "Q1", type: "text" }],
          },
        ],
      });
    }
    if (url === "/wallet/researcher") {
      return Promise.resolve({
        wallet: { available_etb: 5000, escrow_etb: 1000 },
      });
    }
    return Promise.resolve({});
  }),
  ApiRequestError: class ApiRequestError extends Error {},
}));

function renderWithLang(ui: React.ReactNode, lang: "en" | "am") {
  localStorage.setItem("ethosk-language", lang);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authValue: any = {
    user: {
      id: "res-1",
      full_name: "Dr. Abebe",
      role: "researcher",
      subscription_tier: "subscribed",
    },
    token: "mock-token",
  };

  return render(
    <LanguageProvider>
      <AuthContext.Provider value={authValue}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{ui}</MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    </LanguageProvider>,
  );
}

describe("Amharic Localization in Researcher Flows (REH-137)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders DashboardPage in Amharic when language is set to 'am'", async () => {
    renderWithLang(<DashboardPage />, "am");

    expect(await screen.findByText("የምርምር ክትትል ማዕከል")).toBeDefined();
    expect(screen.getByText(/የንቁ ጥናቶች፣ የተሳታፊዎች ምልመላ/)).toBeDefined();
    expect(screen.getByText(/ቀጣይ ጥናቶች \(1\)/)).toBeDefined();
    expect(screen.getByText(/በመስራት ላይ ያሉ \(1\)/)).toBeDefined();
    expect(screen.getByText("የቦርሳ ቀሪ ሂሳብ")).toBeDefined();
    expect(screen.getByText("አዲስ ጥናት")).toBeDefined();
  });

  it("renders DashboardPage in English when language is set to 'en'", async () => {
    renderWithLang(<DashboardPage />, "en");

    expect(await screen.findByText("Research Operations Monitor")).toBeDefined();
    expect(screen.getByText(/Ongoing Studies \(1\)/)).toBeDefined();
    expect(screen.getByText(/Work-in-Progress \(1\)/)).toBeDefined();
    expect(screen.getByText("Wallet Balance")).toBeDefined();
    expect(screen.getByText("New Research")).toBeDefined();
  });

  it("renders SurveyListPage in Amharic with Amharic filters and status badges", async () => {
    renderWithLang(<SurveyListPage />, "am");

    expect(await screen.findByText("የእኔ ጥናቶች")).toBeDefined();
    expect(screen.getByText("ሁሉም ጥናቶች")).toBeDefined();
    expect(screen.getByText("ረቂቆች")).toBeDefined();
    expect(screen.getByText("የተዘጉ")).toBeDefined();
    expect(screen.getByText("አዲስ ጥናት ፍጠር")).toBeDefined();
    expect(screen.getByPlaceholderText("ጥናቶችን በርዕስ ፈልግ...")).toBeDefined();

    // Verify Amharic status badges
    expect(await screen.findByText("ንቁ")).toBeDefined();
    expect(await screen.findByText("በመስራት ላይ ያለ")).toBeDefined();
  });

  it("renders SurveyNewLandingPage in Amharic with localized creation methods", async () => {
    renderWithLang(<SurveyNewLandingPage />, "am");

    expect(await screen.findByText("አዲስ ጥናት ፍጠር")).toBeDefined();
    expect(screen.getByText("የጥናት መፍጠሪያ ዘዴ ይምረጡ")).toBeDefined();
    expect(screen.getByText("በእጅ ማዘጋጃ")).toBeDefined();
    expect(screen.getByText("ጥያቄዎችን ከፋይል አስመጣ")).toBeDefined();
    expect(screen.getByText("በ AI አመንጭ")).toBeDefined();
    expect(screen.getByText("ወይም ከተረጋገጠ የምርምር አብነት ይጀምሩ፡")).toBeDefined();
  });
});
