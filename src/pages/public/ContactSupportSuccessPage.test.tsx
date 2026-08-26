import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ContactSupportSuccessPage } from "./ContactSupportSuccessPage";
import { LanguageProvider } from "@/lib/language";

function renderContactSupportSuccessPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/contact/success?ticket=ETH-8821"]}>
        <Routes>
          <Route path="/contact/success" element={<ContactSupportSuccessPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Contact & Support: Success (Stitch Screen 6e0e7e1e4d274e79902a95c33037a3b6)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders success title, ticket ID badge, knowledge base link, and home button", () => {
    renderContactSupportSuccessPage();

    expect(screen.getByRole("heading", { name: "Message Received!" })).toBeDefined();
    expect(
      screen.getByText(/A support specialist will review your request and respond/i),
    ).toBeDefined();

    expect(screen.getByText("Ticket ID:")).toBeDefined();
    expect(screen.getByText("#ETH-8821")).toBeDefined();

    expect(screen.getByRole("link", { name: /Knowledge Base/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Return to Homepage/i })).toBeDefined();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderContactSupportSuccessPage();

    expect(screen.getByRole("heading", { name: "መልእክትዎ ደርሶናል!" })).toBeDefined();
    expect(screen.getByText("የትኬት ቁጥር:")).toBeDefined();
    expect(screen.getByRole("link", { name: /ወደ መነሻ ገጽ ይመለሱ/i })).toBeDefined();
  });
});
