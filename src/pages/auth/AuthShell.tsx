import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { UserRole } from "@shared/types";
import { Icon } from "@/components/ui";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      <div className="flex flex-1 items-center justify-center px-margin-mobile py-stack-lg">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Link className="font-headline-md text-headline-md font-bold text-primary" to="/">
              Ethosk
            </Link>
            <h1 className="mt-stack-md font-display-lg-mobile text-[28px] font-bold leading-tight text-on-surface">
              {title}
            </h1>
            <p className="mt-stack-sm font-body-sm text-body-sm text-on-surface-variant">
              {subtitle}
            </p>
          </div>

          <div className="mt-stack-lg">{children}</div>

          <div className="mt-stack-lg text-center font-body-sm text-body-sm text-on-surface-variant">
            {footer}
          </div>

          <div className="mt-stack-lg flex justify-center">
            <span className="inline-flex items-center gap-stack-sm rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-caps text-label-caps uppercase text-on-surface-variant">
              <Icon className="text-[16px] text-primary" filled name="verified_user" />
              Fayda Verified Access
            </span>
          </div>
        </div>
      </div>

      <footer className="border-t border-outline-variant bg-surface-container px-margin-mobile py-stack-md text-center">
        <p className="font-body-sm text-[12px] text-on-surface-variant">
          © {new Date().getFullYear()} Ethosk. All rights reserved.
        </p>
        <p className="mt-base font-label-caps text-[10px] uppercase text-on-surface-variant">
          Fully compliant with Federal Democratic Republic of Ethiopia Proclamation 1321/2024
        </p>
      </footer>
    </div>
  );
}

/** The segmented Researcher / Respondent selector from the login design. */
export function RoleTabs({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const options: { role: UserRole; label: string; icon: string }[] = [
    { role: "researcher", label: "Researcher", icon: "science" },
    { role: "respondent", label: "Respondent", icon: "groups" },
  ];

  return (
    <div
      className="flex rounded-full border border-outline-variant bg-surface-container-lowest p-1"
      role="tablist"
    >
      {options.map((option) => {
        const active = value === option.role;
        return (
          <button
            aria-selected={active}
            className={clsx(
              "flex flex-1 items-center justify-center gap-stack-sm rounded-full px-4 py-2.5 font-title-sm text-body-md transition-colors",
              active
                ? "bg-primary font-semibold text-on-primary"
                : "text-on-surface-variant hover:text-primary",
            )}
            key={option.role}
            onClick={() => onChange(option.role)}
            role="tab"
            type="button"
          >
            <Icon className="text-[18px]" filled={active} name={option.icon} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
