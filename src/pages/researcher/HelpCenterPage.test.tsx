import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelpCenterPage } from "./HelpCenterPage";

describe("HelpCenterPage (Stitch Help Center & Knowledge Base)", () => {
  it("renders hero search section, popular tags, categories and FAQ items", () => {
    render(
      <MemoryRouter>
        <HelpCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("How can we help your research today?")).toBeDefined();
    expect(screen.getByPlaceholderText(/Search questions, guides, API endpoints/i)).toBeDefined();
    expect(screen.getByText("Survey Building & AI Schema")).toBeDefined();
    expect(screen.getByText("Targeting & Verification")).toBeDefined();
    expect(screen.getByText("Wallet, Escrow & Invoicing")).toBeDefined();
    expect(screen.getByText("IRB & Ethics Review")).toBeDefined();
    expect(screen.getByText("Frequently Asked Questions")).toBeDefined();
    expect(screen.getByText("Still need assistance?")).toBeDefined();
  });

  it("filters FAQs based on search input", () => {
    render(
      <MemoryRouter>
        <HelpCenterPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByPlaceholderText(/Search questions, guides, API endpoints/i);
    fireEvent.change(searchInput, { target: { value: "Fayda ID" } });

    expect(
      screen.getByText("What happens if an uploaded Fayda ID or Kebele document is flagged as illegible?"),
    ).toBeDefined();
  });

  it("opens modal and submits support ticket returning server ticket ID", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          success: true,
          ticket: { id: "ticket-123", ticket_number: "ETH-99321" },
        }),
    } as any);

    render(
      <MemoryRouter>
        <HelpCenterPage />
      </MemoryRouter>,
    );

    // Open modal
    const openModalBtn = screen.getByRole("button", { name: "Submit Support Ticket" });
    fireEvent.click(openModalBtn);

    expect(screen.getByLabelText("Subject / Topic")).toBeDefined();
    expect(screen.getByLabelText("Details")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Contact Email"), {
      target: { value: "researcher@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject / Topic"), {
      target: { value: "IRB Clearance Documentation Question" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "We have an exemption letter from Addis Ababa University health sciences board." },
    });

    const submitBtn = screen.getByRole("button", { name: "Send Ticket" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Ticket Submitted Successfully!")).toBeDefined();
      expect(screen.getByTestId("returned-ticket-id")).toBeDefined();
      expect(screen.getByText(/#ETH-99321/)).toBeDefined();
    });
  });

  it("displays inline error banner when ticket submission fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () =>
        JSON.stringify({
          error: { code: "SERVER_ERROR", message: "Support ticket submission temporarily unavailable." },
        }),
    } as any);

    render(
      <MemoryRouter>
        <HelpCenterPage />
      </MemoryRouter>,
    );

    const openModalBtn = screen.getByRole("button", { name: "Submit Support Ticket" });
    fireEvent.click(openModalBtn);

    fireEvent.change(screen.getByLabelText("Subject / Topic"), {
      target: { value: "Network Issue" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "Unable to reach the researcher portal during afternoon." },
    });

    const submitBtn = screen.getByRole("button", { name: "Send Ticket" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("help-ticket-error")).toBeDefined();
      expect(screen.getByText("Support ticket submission temporarily unavailable.")).toBeDefined();
    });
  });
});
