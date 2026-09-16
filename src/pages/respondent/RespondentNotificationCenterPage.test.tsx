import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RespondentNotificationCenterPage, type RespondentNotification } from "./RespondentNotificationCenterPage";
import { LanguageProvider } from "@/lib/language";
import * as apiModule from "@/lib/api";

const mockNotifications: RespondentNotification[] = [
  {
    id: "notif-1",
    title: "New Survey Available",
    title_am: "አዲስ ጥናት አለ",
    body: "A new survey on Access to Specialized Healthcare in Mekelle is waiting for you. Reward: 30 ETB.",
    body_am: "አዲስ ጥናት ተዘጋጅቶ ይጠብቅዎታል።",
    timestamp: "10 mins ago",
    section: "today",
    is_read: false,
    type: "survey",
    action_label: "Browse Surveys →",
    action_label_am: "ጥናቶችን ይመልከቱ →",
    action_url: "/inbox",
  },
  {
    id: "notif-2",
    title: "Earnings Credited",
    title_am: "ገቢ ተከፍሏል",
    body: "You earned 25 ETB for completing the 'Participant Recruitment' survey.",
    body_am: "25 ብር ወደ ቦርሳዎ ገቢ ተደርጓል።",
    timestamp: "2 hours ago",
    section: "today",
    is_read: true,
    type: "earnings",
    action_label: "Earnings Dashboard",
    action_label_am: "የገቢ ዳሽቦርድ",
    action_url: "/wallet",
  },
  {
    id: "notif-3",
    title: "Withdrawal Completed",
    title_am: "ገንዘብ ማውጣት ተጠናቋል",
    body: "Your withdrawal of 50 ETB via Telebirr has been processed successfully.",
    body_am: "የ 50 ብር ማውጣትዎ ተጠናቋል።",
    timestamp: "Yesterday",
    section: "yesterday",
    is_read: false,
    type: "withdrawal",
    action_label: "Withdrawal History →",
    action_label_am: "የማውጣት ታሪክ →",
    action_url: "/wallet/history",
  },
  {
    id: "notif-4",
    title: "Account Verified",
    title_am: "መለያ ተረጋግጧል",
    body: "Your account has been verified for Tier 2. You can now access more surveys.",
    body_am: "መለያዎ ለደረጃ 2 ተረጋግጧል።",
    timestamp: "3 days ago",
    section: "older",
    is_read: true,
    type: "verification",
    action_label: "Verification",
    action_label_am: "ማረጋገጫ",
    action_url: "/verify",
  },
];

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/respondent/notifications"]}>
          <Routes>
            <Route
              path="/respondent/notifications"
              element={<RespondentNotificationCenterPage />}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("Ethosk - Respondent Notification Center (Real Backend Data)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.mocked(apiModule.api).mockImplementation((path: string, options?: Parameters<typeof apiModule.api>[1]) => {
      if (path === "/respondents/notifications") {
        return Promise.resolve({
          notifications: mockNotifications,
          unread_count: 2,
        });
      }
      if (path === "/respondents/notifications/mark-all-read") {
        return Promise.resolve({ ok: true });
      }
      if (path.startsWith("/respondents/notifications/") && options?.method === "PATCH") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({});
    });
  });

  it("renders header, mark all read button, grouped sections, and real user notification cards", async () => {
    renderPage();

    // Header & Action button
    expect(await screen.findByRole("button", { name: /Mark All as Read/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeDefined();

    // Grouped section headings
    expect(screen.getByRole("heading", { name: "Today" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Yesterday" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Older" })).toBeDefined();

    // Notification Cards with real user-specific data
    expect(screen.getByText("New Survey Available")).toBeDefined();
    expect(screen.getByText(/Access to Specialized Healthcare in Mekelle/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Browse Surveys/i })).toBeDefined();

    expect(screen.getByText("Earnings Credited")).toBeDefined();
    expect(screen.getByText(/25 ETB for completing/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Earnings Dashboard/i })).toBeDefined();

    expect(screen.getByText("Withdrawal Completed")).toBeDefined();
    expect(screen.getByText(/withdrawal of 50 ETB via Telebirr/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Withdrawal History/i })).toBeDefined();

    expect(screen.getByText("Account Verified")).toBeDefined();
    expect(screen.getByRole("link", { name: /Verification/i })).toBeDefined();
  });

  it("handles Mark All as Read button click and individual card read click", async () => {
    renderPage();

    const markAllBtn = await screen.findByRole("button", { name: /Mark All as Read/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(apiModule.api).toHaveBeenCalledWith("/respondents/notifications/mark-all-read", {
        method: "POST",
      });
    });

    const card = screen.getByText("New Survey Available").closest("div");
    expect(card).toBeDefined();
    if (card) fireEvent.click(card);

    await waitFor(() => {
      expect(apiModule.api).toHaveBeenCalledWith("/respondents/notifications/notif-1/read", {
        method: "PATCH",
      });
    });
  });

  it("handles Amharic locale translations and localized content", async () => {
    localStorage.setItem("ethosk-language", "am");

    renderPage();

    expect(await screen.findByRole("button", { name: /ሁሉንም እንደተነበበ ምልክት አድርግ/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ማሳወቂያዎች" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ዛሬ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "ትናንት" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የቀድሞ" })).toBeDefined();

    // Localized card content
    expect(screen.getByText("አዲስ ጥናት አለ")).toBeDefined();
    expect(screen.getByText("ገቢ ተከፍሏል")).toBeDefined();
    expect(screen.getByText("ገንዘብ ማውጣት ተጠናቋል")).toBeDefined();
  });

  it("renders empty state when there are no notifications", async () => {
    vi.mocked(apiModule.api).mockImplementation((path: string) => {
      if (path === "/respondents/notifications") {
        return Promise.resolve({
          notifications: [],
          unread_count: 0,
        });
      }
      return Promise.resolve({});
    });

    renderPage();

    expect(await screen.findByText("No Notifications Yet")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Mark All as Read/i })).toBeNull();
  });
});
