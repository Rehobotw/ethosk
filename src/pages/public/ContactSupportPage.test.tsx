import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ContactSupportPage } from "./ContactSupportPage";
import { LanguageProvider } from "@/lib/language";

function renderContactSupportPage() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/contact"]}>
        <Routes>
          <Route path="/contact" element={<ContactSupportPage />} />
          <Route path="/contact/success" element={<div>Support Success Page</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe("Ethosk - Contact & Support: Ready (Stitch Screen 8de8c52b67df4957a5ff049e6d880e86)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  it("renders hero title, 3 bento cards, form fields, and headquarters info", () => {
    renderContactSupportPage();

    // Hero & Header
    expect(screen.getByRole("heading", { name: "How can we help?" })).toBeDefined();

    // 3 Bento Cards
    expect(screen.getByRole("heading", { name: "General Inquiry" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Technical Support" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Verification Help" })).toBeDefined();

    // Form inputs
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Issue Category")).toBeDefined();
    expect(screen.getByLabelText("Subject")).toBeDefined();
    expect(screen.getByLabelText("Message")).toBeDefined();

    // Submit button
    expect(screen.getByRole("button", { name: /Send Support Request/i })).toBeDefined();

    // Sidebar
    expect(screen.getByText("Headquarters")).toBeDefined();
    expect(screen.getByText("support@ethosk.com")).toBeDefined();
    expect(screen.getByText("+251 911 234 567")).toBeDefined();
  });

  it("submits contact support form and navigates to success page", () => {
    renderContactSupportPage();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Abebe Bikila" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "abebe@example.com" } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Fayda Verification Help" } });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I need assistance verifying my Fayda FIN number." },
    });

    const submitBtn = screen.getByRole("button", { name: /Send Support Request/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Support Success Page")).toBeDefined();
  });

  it("handles Amharic translations", () => {
    localStorage.setItem("ethosk-language", "am");

    renderContactSupportPage();

    expect(screen.getByRole("heading", { name: "እንዴት ልንረዳዎ እንችላለን?" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "አጠቃላይ ጥያቄ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የቴክኒክ ድጋፍ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "የማረጋገጫ እገዛ" })).toBeDefined();
    expect(screen.getByRole("button", { name: /የድጋፍ ጥያቄ ላክ/i })).toBeDefined();
  });
});
