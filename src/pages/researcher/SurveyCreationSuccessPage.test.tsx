import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SurveyCreationSuccessPage } from "./SurveyCreationSuccessPage";

function renderSuccessPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/survey-builder/success?title=Mobile%20Banking%20Study&count=6&type=Manual%20Builder"]}>
        <SurveyCreationSuccessPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SurveyCreationSuccessPage (Stitch Success Screen)", () => {
  it("renders success headline, summary card with question count and action buttons", () => {
    renderSuccessPage();

    expect(screen.getByText("Survey Draft Created Successfully!")).toBeDefined();
    expect(screen.getByText("Mobile Banking Study")).toBeDefined();
    expect(screen.getByText("6 Questions")).toBeDefined();
    expect(screen.getByText("Schema Validated · No Formatting Errors")).toBeDefined();
    expect(screen.getByText("Proceed to Demographic Targeting & Posting")).toBeDefined();
    expect(screen.getByText("Return to Survey Builder / Edit Questions")).toBeDefined();
    expect(screen.getByText("Back to Research Operations Dashboard")).toBeDefined();
  });
});
