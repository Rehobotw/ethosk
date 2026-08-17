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
  it("Tier 0: Registered — no badge shown, 'Registered' label", () => {
    renderAvatar({
      fullName: "Abebe Kebede",
      verificationTier: "0_registered",
    });

    expect(screen.getByText("Abebe Kebede")).toBeDefined();
    expect(screen.getByText("Registered")).toBeDefined();
    expect(screen.queryByTestId("tier-inline-badge")).toBeNull();
    const link = screen.getByTestId("respondent-avatar-container");
    expect(link.getAttribute("href")).toBe("/profile");
  });

  it("Tier 1: ID Verified — yellow 'Tier 1' badge", () => {
    renderAvatar({
      fullName: "Sara Hailu",
      verificationTier: "1_id_verified",
    });

    expect(screen.getByText("Sara Hailu")).toBeDefined();
    expect(screen.getByText("ID Verified")).toBeDefined();
    const badge = screen.getByTestId("tier-inline-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("Tier 1");
  });

  it("Tier 2: Attribute Verified — blue 'Tier 2' badge", () => {
    renderAvatar({
      fullName: "Dawit Mengistu",
      verificationTier: "2_attribute_verified",
    });

    expect(screen.getByText("Dawit Mengistu")).toBeDefined();
    expect(screen.getByText("Attribute Verified")).toBeDefined();
    const badge = screen.getByTestId("tier-inline-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("Tier 2");
  });

  it("Tier 3: Institution Attested — shows blue 'Tier 2' badge (highest inline badge)", () => {
    renderAvatar({
      fullName: "Tigist Bekele",
      verificationTier: "3_institution_attested",
    });

    expect(screen.getByText("Tigist Bekele")).toBeDefined();
    const badge = screen.getByTestId("tier-inline-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe("Tier 2");
  });

  it("Compact mode hides text block", () => {
    renderAvatar({
      fullName: "Compact User",
      verificationTier: "1_id_verified",
      compact: true,
    });

    // Name text should not be visible in compact mode
    expect(screen.queryByText("Compact User")).toBeNull();
    // Avatar link should still exist
    expect(screen.getByTestId("respondent-avatar-container")).toBeDefined();
  });

  it("Links to /profile and contains no expand/dropdown triggers", () => {
    const { container } = renderAvatar({
      fullName: "Test User",
      verificationTier: "1_id_verified",
    });

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/profile");
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(container.querySelector("[aria-expanded]")).toBeNull();
  });
});
