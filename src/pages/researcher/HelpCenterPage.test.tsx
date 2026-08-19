import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
