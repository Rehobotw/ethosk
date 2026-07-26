import type { ReactNode } from "react";

/**
 * Compact dark banner shared by the two Learn pages, so they open the way the
 * home page does instead of starting with a bare heading on white.
 */
export function PageHero({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-primary text-on-primary">
      <div aria-hidden="true" className="hero-glow absolute inset-0" />

      <div className="relative mx-auto max-w-container-max px-margin-mobile py-16 md:px-gutter md:py-20">
        <div className="max-w-3xl animate-fade-up">
          <span className="font-label-caps text-label-caps uppercase text-primary-fixed-dim">
            {eyebrow}
          </span>
          <h1 className="mt-stack-sm font-display-lg-mobile text-display-lg-mobile text-on-primary md:font-display-lg md:text-display-lg">
            {title}
          </h1>
          <div className="mt-stack-md font-body-md text-body-md text-primary-fixed-dim">
            {children}
          </div>
          {actions ? (
            <div className="mt-stack-lg flex flex-wrap gap-stack-sm">{actions}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Section wrapper matching the home page's rhythm. */
export function PageSection({
  id,
  title,
  intro,
  tone = "surface",
  children,
}: {
  id?: string;
  title: string;
  intro?: ReactNode;
  tone?: "surface" | "raised";
  children: ReactNode;
}) {
  return (
    <section
      className={
        tone === "raised"
          ? "border-y border-outline-variant bg-surface-container-low px-margin-mobile py-16 md:px-gutter md:py-20"
          : "bg-surface px-margin-mobile py-16 md:px-gutter md:py-20"
      }
      id={id}
    >
      <div className="mx-auto max-w-container-max">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">{title}</h2>
        {intro ? (
          <div className="mt-stack-sm max-w-3xl font-body-md text-body-md text-on-surface-variant">
            {intro}
          </div>
        ) : null}
        <div className="mt-stack-lg">{children}</div>
      </div>
    </section>
  );
}
