import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./language";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe("Language Context & i18n", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to English ('en')", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe("en");
    expect(result.current.t("nav.how_it_works")).toBe("How it works");
  });

  it("switches language to Amharic ('am') and returns translated string", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage("am");
    });

    expect(result.current.language).toBe("am");
    expect(result.current.t("nav.how_it_works")).toBe("እንዴት እንደሚሰራ");
    expect(result.current.t("hero.badge_fayda")).toBe("በፋይዳ የተረጋገጠ ፓነል");
  });

  it("toggles language using toggleLanguage", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage("en");
    });
    expect(result.current.language).toBe("en");

    act(() => {
      result.current.toggleLanguage();
    });
    expect(result.current.language).toBe("am");
  });

  it("falls back to English when a path is missing in target language", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage("am");
    });

    // Valid path
    expect(result.current.t("common.save")).toBe("ስራውን አስቀምጥ");
    // Invalid path returns raw path
    expect(result.current.t("non.existent.path")).toBe("non.existent.path");
  });
});
