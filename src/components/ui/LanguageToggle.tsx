import clsx from "clsx";
import { useLanguage } from "@/lib/language";
import { Icon } from "./index";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();
  const isEnglish = language === "en";

  return (
    <button
      aria-label={isEnglish ? "Switch to Amharic" : "Switch to English"}
      className={clsx(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1 font-label-caps text-[12px] font-semibold text-on-surface shadow-sm transition-all hover:scale-105 hover:border-primary/40 dark:bg-slate-800 dark:text-slate-100",
        className,
      )}
      onClick={toggleLanguage}
      title={isEnglish ? "Switch to Amharic (አማርኛ)" : "Switch to English"}
      type="button"
    >
      <Icon className="text-[16px] text-primary" name="language" />
      <span>{isEnglish ? "EN" : "አማ"}</span>
    </button>
  );
}
