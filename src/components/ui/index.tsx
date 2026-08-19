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
  primary: "bg-primary text-white hover:bg-primary/90 shadow-sm active:scale-[0.98]",
  outline: "border border-primary/30 text-primary hover:bg-primary/5 hover:border-primary",
  ghost: "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface",
  danger: "border border-error/30 text-error hover:bg-error/10",
  secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-headline-md text-sm font-semibold transition-all whitespace-nowrap select-none",
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
  "placeholder:text-on-surface-variant/40 placeholder:font-normal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60";

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

export type NoticeTone = "info" | "warning" | "error" | "success";

const NOTICE_TONES: Record<NoticeTone, { wrapper: string; icon: string; iconColor: string }> = {
  info: {
    wrapper: "bg-primary-fixed/20 text-primary border border-primary/20",
    icon: "info",
    iconColor: "text-primary",
  },
  warning: {
    wrapper: "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs",
    icon: "warning",
    iconColor: "text-amber-600",
  },
  error: {
    wrapper: "bg-rose-50 text-rose-900 border border-rose-200/80 shadow-xs",
    icon: "error",
    iconColor: "text-rose-600",
  },
  success: {
    wrapper: "bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-xs",
    icon: "check_circle",
    iconColor: "text-emerald-600",
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
      className={clsx(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-sm",
        config.wrapper,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className={clsx("material-symbols-outlined shrink-0 text-[20px]", config.iconColor)}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title ? <p className="font-bold text-sm leading-tight mb-0.5">{title}</p> : null}
        {children ? (
          <div className="text-xs leading-relaxed font-medium">{children}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          aria-label="Dismiss"
          className="shrink-0 self-center opacity-60 hover:opacity-100 cursor-pointer p-1 rounded-md transition-opacity"
          onClick={onDismiss}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  children,
  action,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm px-8 py-14 text-center shadow-xs">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10">
        <Icon className="text-[28px] text-primary" name={icon} />
      </div>
      <h3 className="text-lg font-bold text-primary tracking-tight font-headline-md">{title}</h3>
      {children ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 font-normal">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({
  label = "Loading…",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-4 text-center select-none py-16 px-4",
        fullScreen
          ? "fixed inset-0 z-50 bg-[#F4F7FA]/90 backdrop-blur-sm"
          : "min-h-[320px] w-full",
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Glow & double-ring animated pulse */}
        <div className="absolute -inset-2 rounded-full bg-primary/10 blur-md animate-pulse" />
        <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
        <div className="absolute w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-headline-md text-sm font-bold text-primary tracking-tight">{label}</p>
        <p className="text-xs text-on-surface-variant font-medium">Please wait a moment…</p>
      </div>
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
