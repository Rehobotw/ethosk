import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RespondentAvatar } from "./RespondentAvatar";

function renderAvatar(props: React.ComponentProps<typeof RespondentAvatar>) {
  return render(
    <MemoryRouter>
      <RespondentAvatar {...props} />
    </MemoryRouter>,
  );
}

describe("RespondentAvatar (§3.1 Component Spec)", () => {
  it("Variant P0 (Tier 0): subtitle shows 'Tier 0' and no badge", () => {
    renderAvatar({
      fullName: "Abebe Kebede",
      verificationTier: "0_registered",
    });

    expect(screen.getByText("Abebe Kebede")).toBeDefined();
    expect(screen.getByText("Tier 0")).toBeDefined();
    expect(screen.queryByTestId("tier-inline-badge")).toBeNull();
    const link = screen.getByTestId("respondent-avatar-container");
    expect(link.getAttribute("href")).toBe("/respondent/profile");
  });

  it("Variant P1 (Tier 1): yellow badge + white checkmark renders inline before 'Tier 1'", () => {
    renderAvatar({
      fullName: "Sara Hailu",
      verificationTier: "1_id_verified",
    });

    expect(screen.getByText("Sara Hailu")).toBeDefined();
    expect(screen.getByText("Tier 1")).toBeDefined();
    const badge = screen.getByTestId("tier-inline-badge");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("bg-[#f59e0b]"); // Yellow background
  });

  it("Variant P2 (Tier 2): blue badge + white checkmark renders inline before 'Tier 2'", () => {
    renderAvatar({
      fullName: "Dawit Mengistu",
      verificationTier: "2_attribute_verified",
    });

    expect(screen.getByText("Dawit Mengistu")).toBeDefined();
    expect(screen.getByText("Tier 2")).toBeDefined();
    const badge = screen.getByTestId("tier-inline-badge");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("bg-[#0066cc]"); // Blue background
  });

  it("Higher Tier 3 inherits blue badge and 'Tier 2' linear max indicator", () => {
    renderAvatar({
      fullName: "Tigist Bekele",
      verificationTier: "3_institution_attested",
    });

    expect(screen.getByText("Tigist Bekele")).toBeDefined();
    expect(screen.getByText("Tier 2")).toBeDefined();
    const badge = screen.getByTestId("tier-inline-badge");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("bg-[#0066cc]");
  });

  it("Compact mode hides text block for mobile header", () => {
    renderAvatar({
      fullName: "Compact User",
      verificationTier: "1_id_verified",
      compact: true,
    });

    expect(screen.queryByText("Compact User")).toBeNull();
    expect(screen.getByTestId("respondent-avatar-container")).toBeDefined();
  });

  it("Links to /respondent/profile and contains no hover cards, dropdowns, or corner badges", () => {
    const { container } = renderAvatar({
      fullName: "Test User",
      verificationTier: "1_id_verified",
    });

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/respondent/profile");
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(container.querySelector("[aria-expanded]")).toBeNull();
  });
});
