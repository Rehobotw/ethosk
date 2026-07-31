import { Link } from "react-router-dom";
import clsx from "clsx";
import { Icon } from "../ui";
import { useLanguage, type Language } from "@/lib/language";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
];

export function Footer({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  const columns = [
    {
      heading: t("nav.platform"),
      links: [
        { label: t("nav.how_it_works"), to: "/#how" },
        { label: t("nav.platform"), to: "/#product" },
        { label: t("nav.verification"), to: "/#verification" },
      ],
    },
    {
      heading: t("nav.for_researchers"),
      links: [
        { label: t("nav.for_researchers"), to: "/learn/researchers" },
        { label: t("nav.for_respondents"), to: "/learn/respondents" },
      ],
    },
    {
      heading: t("common.actions"),
      links: [
        { label: t("nav.login"), to: "/login" },
        { label: t("nav.signup"), to: "/signup" },
      ],
    },
  ];

  return (
    <footer className={clsx("border-t border-outline-variant bg-surface-subtle", className)}>
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-stack-lg md:px-gutter">
        <div className="grid gap-stack-lg md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link className="font-headline-md text-headline-md font-bold text-primary" to="/">
              Ethosk
            </Link>
            <p className="mt-stack-sm max-w-xs font-body-sm text-body-sm text-on-surface-variant">
              {t("footer.tagline")}
            </p>

            <div className="mt-stack-md flex flex-wrap gap-base">
              {LANGUAGES.map((lang) => (
                <button
                  className={clsx(
                    "rounded-full px-3 py-1 font-label-caps text-label-caps transition-colors",
                    language === lang.code
                      ? "bg-surface-container-high text-on-surface font-bold"
                      : "text-on-surface-variant hover:bg-surface-container",
                  )}
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  type="button"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.heading}>
              <h2 className="font-label-caps text-label-caps uppercase text-on-surface">
                {column.heading}
              </h2>
              <ul className="mt-stack-sm space-y-stack-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                      to={link.to}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-stack-lg flex flex-col-reverse items-start justify-between gap-stack-sm border-t border-outline-variant pt-stack-md md:flex-row md:items-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            © {new Date().getFullYear()} Ethosk
          </p>
          <p className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <Icon className="text-[18px] text-status-passed" name="shield" />
            Designed around Proclamation 1321/2024
          </p>
        </div>
      </div>
    </footer>
  );
}
