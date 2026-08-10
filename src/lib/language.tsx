import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./translations/en";
import { am } from "./translations/am";

export type Language = "en" | "am";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
}

const translations = { en, am };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "ethosk-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    return saved === "en" || saved === "am" ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "am" : "en"));
  }, []);

  /**
   * Safe nested key lookup (e.g. t('nav.how_it_works'))
   * Falls back to English if missing in target language, or key string itself.
   */
  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".");

      // Try primary language
      let current: unknown = translations[language];
      for (const k of keys) {
        if (current && typeof current === "object" && k in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[k];
        } else {
          current = undefined;
          break;
        }
      }
      if (typeof current === "string") return current;

      // Fallback to English
      let fallback: unknown = translations.en;
      for (const k of keys) {
        if (fallback && typeof fallback === "object" && k in (fallback as Record<string, unknown>)) {
          fallback = (fallback as Record<string, unknown>)[k];
        } else {
          fallback = undefined;
          break;
        }
      }

      return typeof fallback === "string" ? fallback : path;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
