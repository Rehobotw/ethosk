import clsx from "clsx";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { TIER_LABEL, type FraudFlag, type VerificationTier } from "@shared/types";

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

export function Icon({
  name,
  className,
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={clsx("material-symbols-outlined", className)}
      data-filled={filled ? "true" : undefined}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  loading?: boolean;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  outline: "border border-primary text-primary hover:bg-primary/5",
  ghost: "text-on-surface-variant hover:bg-surface-container-highest",
  danger: "border border-error text-error hover:bg-error-container",
  secondary: "bg-primary-container text-on-primary-container hover:opacity-80",
};

export function Button({
  variant = "primary",
  icon,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-stack-sm rounded-xl px-stack-md py-stack-sm font-title-sm text-body-md font-semibold transition-all",
        "disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon className="text-[18px]" name={icon} /> : null}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

export function Field({
  label,
  error,
  hint,
  action,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-base flex items-center justify-between">
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          {label}
        </span>
        {action}
      </span>
      {children}
      {error ? (
        <span className="mt-base block font-body-sm text-body-sm text-error">{error}</span>
      ) : hint ? (
        <span className="mt-base block font-body-sm text-body-sm text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const CONTROL_CLASS =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface " +
  "placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60";

/**
 * Every control below forwards its ref, because `register` from react-hook-form
 * spreads a `ref` onto them.
 *
 * Without forwarding, React silently drops that ref, the form library never holds
 * the DOM node, and it cannot read a value the browser filled in on its own. The
 * symptom is a field the user can plainly see is filled reporting "Required" on
 * submit, because autofill does not always reach React's onChange.
 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input className={clsx(CONTROL_CLASS, className)} ref={ref} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...rest }, ref) {
    return <select className={clsx(CONTROL_CLASS, className)} ref={ref} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea className={clsx(CONTROL_CLASS, "resize-y", className)} ref={ref} {...rest} />;
});

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-outline-variant bg-surface-container-lowest",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-stack-lg flex flex-col gap-stack-md md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-display-lg text-headline-md tracking-tight text-primary md:text-display-lg">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-base font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-stack-sm">{actions}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export function TierBadge({ tier }: { tier: VerificationTier }) {
  const styles: Record<VerificationTier, string> = {
    "0_registered": "bg-surface-container-high text-on-surface-variant",
    "1_id_verified": "bg-primary-fixed text-on-primary-fixed",
    "2_attribute_verified": "bg-secondary-container text-on-secondary-container",
    "3_institution_attested": "bg-status-passed/15 text-flag-clean",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 font-status-badge text-status-badge",
        styles[tier],
      )}
    >
      <Icon className="text-[14px]" filled name="verified" />
      {TIER_LABEL[tier]}
    </span>
  );
}

export function FlagBadge({ flag }: { flag: FraudFlag }) {
  const config: Record<FraudFlag, { label: string; className: string; icon: string }> = {
    clean: {
      label: "Clean",
      className: "bg-status-passed/15 text-flag-clean",
      icon: "check_circle",
    },
    flagged: {
      label: "Flagged",
      className: "bg-status-failed/15 text-flag-fraud",
      icon: "flag",
    },
  };
  const { label, className, icon } = config[flag];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 font-status-badge text-status-badge",
        className,
      )}
    >
      <Icon className="text-[14px]" filled name={icon} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

type NoticeTone = "info" | "warning" | "error" | "success";

const NOTICE_TONES: Record<NoticeTone, { wrapper: string; icon: string }> = {
  info: { wrapper: "bg-surface-container-low text-on-surface border-outline-variant", icon: "info" },
  warning: {
    wrapper: "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/20",
    icon: "warning",
  },
  error: { wrapper: "bg-error-container text-on-error-container border-error/20", icon: "error" },
  success: {
    wrapper: "bg-status-passed/10 text-flag-clean border-status-passed/30",
    icon: "check_circle",
  },
};

export function Notice({
  tone = "info",
  title,
  children,
  onDismiss,
}: {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
}) {
  const config = NOTICE_TONES[tone];

  return (
    <div
      className={clsx("flex gap-stack-sm rounded-xl border p-stack-md", config.wrapper)}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="shrink-0 text-[20px]" name={config.icon} />
      <div className="flex-1">
        {title ? <p className="font-title-sm text-body-md font-bold">{title}</p> : null}
        {children ? (
          <div className="mt-base font-body-sm text-body-sm leading-snug">{children}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          aria-label="Dismiss"
          className="shrink-0 self-start opacity-70 hover:opacity-100"
          onClick={onDismiss}
          type="button"
        >
          <Icon className="text-[18px]" name="close" />
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  children,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant px-stack-md py-stack-lg text-center">
      <Icon className="text-[32px] text-outline" name={icon} />
      <p className="mt-stack-sm font-title-sm text-title-sm text-on-surface">{title}</p>
      {children ? (
        <p className="mt-base max-w-md font-body-sm text-body-sm text-on-surface-variant">
          {children}
        </p>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-stack-sm py-stack-lg text-on-surface-variant">
      <Spinner />
      <span className="font-body-sm text-body-sm">{label}</span>
    </div>
  );
}

export function StatBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-subtle p-stack-sm">
      <p className="font-label-caps text-[11px] uppercase text-on-surface-variant">{label}</p>
      <p
        className={clsx(
          "mt-base font-headline-md text-title-sm",
          tone === "danger" ? "text-error" : "text-on-surface",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      aria-checked={checked}
      className="flex items-center gap-stack-sm"
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="font-body-sm text-body-sm text-on-surface-variant">{label}</span>
      <span
        className={clsx(
          "relative h-4 w-8 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-outline-variant",
        )}
      >
        <span
          className={clsx(
            "absolute top-0 h-4 w-4 rounded-full border border-outline bg-white shadow-sm transition-all",
            checked ? "right-0" : "right-4",
          )}
        />
      </span>
    </button>
  );
}
