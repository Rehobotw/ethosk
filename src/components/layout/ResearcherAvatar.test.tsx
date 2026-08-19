import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ResearcherAvatar } from "./ResearcherAvatar";

function renderAvatar(props: React.ComponentProps<typeof ResearcherAvatar>) {
  return render(
    <MemoryRouter>
      <ResearcherAvatar {...props} />
    </MemoryRouter>,
  );
}

describe("ResearcherAvatar (§4.1 Component Spec)", () => {
  it("Variant R1: Unverified + Free Plan (Badge Hidden, 'Free Plan' shown)", () => {
    renderAvatar({
      fullName: "Dr. Almaz Kebede",
      isVerified: false,
      subscriptionTier: "free",
    });

    expect(screen.getByText("Dr. Almaz Kebede")).toBeDefined();
    expect(screen.getByText("Free Plan")).toBeDefined();
    expect(screen.queryByTestId("verified-corner-badge")).toBeNull();
    const link = screen.getByTestId("researcher-avatar-container");
    expect(link.getAttribute("href")).toBe("/profile/settings");
  });

  it("Variant R2: Unverified + Pro Tier (Badge Hidden, 'Pro Tier' shown)", () => {
    renderAvatar({
      fullName: "Yonas Berhanu",
      isVerified: false,
      subscriptionTier: "subscribed",
    });

    expect(screen.getByText("Yonas Berhanu")).toBeDefined();
    expect(screen.getByText("Pro Tier")).toBeDefined();
    expect(screen.queryByTestId("verified-corner-badge")).toBeNull();
  });

  it("Variant R3: Verified + Free Plan (Badge Visible, 'Free Plan' shown)", () => {
    renderAvatar({
      fullName: "Sara Haile",
      isVerified: true,
      subscriptionTier: "free",
    });

    expect(screen.getByText("Sara Haile")).toBeDefined();
    expect(screen.getByText("Free Plan")).toBeDefined();
    expect(screen.getByTestId("verified-corner-badge")).toBeDefined();
  });

  it("Variant R4: Verified + Pro Tier (Badge Visible, 'Pro Tier' shown)", () => {
    renderAvatar({
      fullName: "Prof. Dawit Mengistu",
      isVerified: true,
      subscriptionTier: "subscribed",
    });

    expect(screen.getByText("Prof. Dawit Mengistu")).toBeDefined();
    expect(screen.getByText("Pro Tier")).toBeDefined();
    expect(screen.getByTestId("verified-corner-badge")).toBeDefined();
  });

  it("Links to /profile/settings and contains no expand/dropdown triggers", () => {
    const { container } = renderAvatar({
      fullName: "Dr. Almaz Kebede",
      isVerified: true,
      subscriptionTier: "subscribed",
    });

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/profile/settings");
    expect(container.querySelector("[role='menu']")).toBeNull();
    expect(container.querySelector("[aria-expanded]")).toBeNull();
  });
});
