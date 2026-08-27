import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/lib/language";
import {
  NoSearchResultsPage,
  SurveyNotFoundPage,
  SurveyClosedPage,
  SurveyPausedPage,
  SurveyNotEligiblePage,
  SurveyCompletedPage,
  SurveySubmissionErrorPage,
  SurveySubmissionSuccessPage,
  EmptyStateShowcasePage,
} from "./SurveyStatePages";

describe("Ethosk - Survey State & Empty State Screens (Stitch Screens)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  describe("No Search Results State (Stitch Screen e048f93bddff46a984fb0bf010bd1963)", () => {
    it("renders headline and filter action buttons", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <NoSearchResultsPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "No matching results" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Clear Filters" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Try Another Search" })).toBeDefined();
    });
  });

  describe("Survey Not Found State (Stitch Screen 44afc24e91cc474e8b0663e672386f34)", () => {
    it("renders survey unavailable headline and browse button", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveyNotFoundPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Survey Unavailable" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Browse Available Surveys" })).toBeDefined();
    });
  });

  describe("Survey Closed State (Stitch Screen e5326e0d9f8a4b7ba1ba1c813e8ce9ea)", () => {
    it("renders survey closed headline and recommended alternative cards", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveyClosedPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Survey Closed" })).toBeDefined();
      expect(
        screen.getByRole("heading", { name: "Other surveys you might be interested in" }),
      ).toBeDefined();
      expect(screen.getByText("45 ETB")).toBeDefined();
      expect(screen.getByText("60 ETB")).toBeDefined();
    });
  });

  describe("Survey Paused State (Stitch Screen 5d1fd75a424c4841858141cd7abf75a8)", () => {
    it("renders survey paused headline and dashboard button", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveyPausedPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(
        screen.getByRole("heading", { name: "Survey Temporarily Paused" }),
      ).toBeDefined();
      expect(screen.getByRole("link", { name: "Return to Dashboard" })).toBeDefined();
    });
  });

  describe("Survey Not Eligible State (Stitch Screen db1a52de570a41f19b5455dba6478306)", () => {
    it("renders not eligible headline and demographic explanation", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveyNotEligiblePage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(
        screen.getByRole("heading", { name: "Not Eligible for This Survey" }),
      ).toBeDefined();
      expect(screen.getByText(/demographic groups/i)).toBeDefined();
    });
  });

  describe("Survey Already Completed State (Stitch Screen 5f15e3afaf074feb89afa1f77ac1b6f3)", () => {
    it("renders completed headline, reward status box, and view earnings button", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveyCompletedPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(
        screen.getByRole("heading", { name: "Survey Already Completed" }),
      ).toBeDefined();
      expect(screen.getByText(/50 ETB — Credited to Wallet/i)).toBeDefined();
      expect(screen.getByRole("link", { name: "View Earnings" })).toBeDefined();
    });
  });

  describe("Survey Submission Error / Recovery (Stitch Screen 888f7aa703b54027acd7dcde112933af)", () => {
    it("renders submission interrupted, local progress status badge, and recovery button", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveySubmissionErrorPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Submission Interrupted" })).toBeDefined();
      expect(screen.getByText(/Progress Status: Saved Locally/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeDefined();
      expect(
        screen.getByRole("link", { name: /Recover & Return to Survey/i }),
      ).toBeDefined();
    });
  });

  describe("Survey Submission Success (Stitch Screen e35d518b98814def84e33b99ffccf307)", () => {
    it("renders submission success headline, reward summary block, and what happens next guidance", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SurveySubmissionSuccessPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(
        screen.getByRole("heading", { name: "Survey Completed Successfully" }),
      ).toBeDefined();
      expect(screen.getByText("50 ETB")).toBeDefined();
      expect(screen.getByRole("heading", { name: "What happens next?" })).toBeDefined();
      expect(screen.getByRole("link", { name: /View Earnings/i })).toBeDefined();
    });
  });

  describe("Empty State Components Showcase (Stitch Screen 362d40f98b5d4825b5921b01903664e7)", () => {
    it("renders showcase title and component preview sections", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <EmptyStateShowcasePage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(
        screen.getByRole("heading", { name: "Empty State Components Showcase" }),
      ).toBeDefined();
    });
  });
});
