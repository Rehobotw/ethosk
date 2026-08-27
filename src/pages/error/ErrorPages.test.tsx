import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/lib/language";
import { NotFoundPage } from "./NotFoundPage";
import { AccessDeniedPage } from "./AccessDeniedPage";
import { SessionExpiredPage } from "./SessionExpiredPage";
import { ServerErrorPage } from "./ServerErrorPage";
import { NetworkErrorPage } from "./NetworkErrorPage";
import { MaintenancePage } from "./MaintenancePage";

describe("Ethosk - Error & Status Pages (Stitch Screens)", () => {
  beforeEach(() => {
    localStorage.setItem("ethosk-language", "en");
    vi.clearAllMocks();
  });

  describe("404 Page Not Found (Stitch Screen 27e93188d14e4dc8bf1975a402412646)", () => {
    it("renders headline, description, actions, and support link", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <NotFoundPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "404 - Page Not Found" })).toBeDefined();
      expect(screen.getByText(/might have been removed/i)).toBeDefined();
      expect(screen.getByRole("link", { name: /Back to Homepage/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /Go to Dashboard/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /Contact Support/i })).toBeDefined();
    });

    it("renders Amharic translation", () => {
      localStorage.setItem("ethosk-language", "am");
      render(
        <LanguageProvider>
          <MemoryRouter>
            <NotFoundPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "404 - ገጹ አልተገኘም" })).toBeDefined();
    });
  });

  describe("403 Access Denied (Stitch Screen a7b71769c26c47b9a57b7c43e2ae9aa5)", () => {
    it("renders headline, lock icon, and dashboard/support buttons", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <AccessDeniedPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Access Restricted" })).toBeDefined();
      expect(screen.getByText(/do not have permission/i)).toBeDefined();
      expect(screen.getByRole("link", { name: /Return to Dashboard/i })).toBeDefined();
      expect(screen.getAllByRole("link", { name: /Contact Support/i }).length).toBeGreaterThan(0);
    });
  });

  describe("Session Expired (Stitch Screen 4ac6c75f3c024bbc86b88940587670d3)", () => {
    it("renders session expired headline and Log In Again button", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <SessionExpiredPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Session Expired" })).toBeDefined();
      expect(screen.getByText(/session has timed out/i)).toBeDefined();
      expect(screen.getByRole("link", { name: /Log In Again/i })).toBeDefined();
    });
  });

  describe("500 Server Error (Stitch Screen 824f86777a044bb1b74876fb070d6199)", () => {
    it("renders error headline, retry button, and error code badge", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <ServerErrorPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeDefined();
      expect(screen.getByText(/unexpected error on our server/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeDefined();
      expect(screen.getByText(/Error Code: 500 INTERNAL_SERVER_ERROR/i)).toBeDefined();
    });
  });

  describe("Network Error (Stitch Screen 71a1ca66c9fc4180979181397b5b36d5)", () => {
    it("renders connection problem headline and action buttons", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <NetworkErrorPage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(screen.getByRole("heading", { name: "Connection Problem" })).toBeDefined();
      expect(screen.getByText(/trouble connecting to our servers/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Return to Previous Page/i })).toBeDefined();
    });
  });

  describe("Maintenance Mode (Stitch Screen fc657b2ad2c64e94b630ce4634521d34)", () => {
    it("renders maintenance headline, retry, and home buttons", () => {
      render(
        <LanguageProvider>
          <MemoryRouter>
            <MaintenancePage />
          </MemoryRouter>
        </LanguageProvider>,
      );

      expect(
        screen.getByRole("heading", { name: "Ethosk is temporarily unavailable" }),
      ).toBeDefined();
      expect(screen.getByText(/performing scheduled maintenance/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /Return Home/i })).toBeDefined();
    });
  });
});
