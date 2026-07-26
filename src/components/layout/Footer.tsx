import { Link } from "react-router-dom";
import clsx from "clsx";
import { Icon } from "../ui";

const LANGUAGES = ["English", "አማርኛ", "Afaan Oromoo"];

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "How it works", to: "/#how" },
      { label: "Quality checks", to: "/#product" },
      { label: "Verification tiers", to: "/#verification" },
    ],
  },
  {
    heading: "Who it is for",
    links: [
      { label: "For researchers", to: "/learn/researchers" },
      { label: "For respondents", to: "/learn/respondents" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Create an account", to: "/signup" },
    ],
  },
];

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={clsx("border-t border-outline-variant bg-surface-subtle", className)}>
      <div className="mx-auto w-full max-w-container-max px-margin-mobile py-stack-lg md:px-gutter">
        <div className="grid gap-stack-lg md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link className="font-headline-md text-headline-md font-bold text-primary" to="/">
              Ethosk
            </Link>
            <p className="mt-stack-sm max-w-xs font-body-sm text-body-sm text-on-surface-variant">
              A verified research panel for Ethiopia, built so a sample can be defended
              rather than assumed.
            </p>

            <div className="mt-stack-md flex flex-wrap gap-base">
              {LANGUAGES.map((language, index) => (
                <button
                  className={clsx(
                    "rounded-full px-3 py-1 font-label-caps text-label-caps transition-colors",
                    index === 0
                      ? "bg-surface-container-high text-on-surface"
                      : "text-on-surface-variant hover:bg-surface-container",
                  )}
                  key={language}
                  type="button"
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
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
