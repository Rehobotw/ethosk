import { Link } from "react-router-dom";
import { TIER_LABEL, VERIFICATION_TIERS, type VerificationTier } from "@shared/types";
import { Button, Icon } from "@/components/ui";
import { useLanguage } from "@/lib/language";

export function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Capabilities />
      <VerificationLadder />
      <Audiences />
      <ClosingCta />
    </>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-primary text-on-primary">
      <div aria-hidden="true" className="hero-glow absolute inset-0" />

      <div className="relative mx-auto grid max-w-container-max items-center gap-stack-lg px-margin-mobile py-20 md:px-gutter md:py-28 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-fixed-dim/30 bg-primary-fixed/10 px-3 py-1 font-label-caps text-label-caps uppercase text-primary-fixed-dim">
            <Icon className="text-[14px]" filled name="verified_user" />
            {t("hero.badge_fayda")}
          </span>

          <h1 className="mt-stack-md font-display-lg-mobile text-display-lg-mobile text-on-primary md:font-display-xl md:text-display-xl">
            {t("hero.title_main")}
          </h1>

          <p className="mt-stack-md max-w-xl font-body-md text-body-md text-primary-fixed-dim">
            {t("hero.subtitle")}
          </p>

          <div className="mt-stack-lg flex flex-wrap items-center gap-stack-sm">
            <Link to="/signup?role=researcher">
              <Button
                className="bg-surface-container-lowest px-5 py-3 text-primary shadow-lifted hover:bg-primary-fixed"
                icon="arrow_forward"
              >
                {t("hero.cta_start")}
              </Button>
            </Link>
            <Link to="/learn/respondents">
              <Button
                className="border border-primary-fixed-dim/40 px-5 py-3 text-primary-fixed-dim hover:border-primary-fixed-dim hover:bg-primary-fixed/10 hover:text-primary-fixed"
                variant="ghost"
              >
                {t("hero.cta_join")}
              </Button>
            </Link>
          </div>

          <ul className="mt-stack-lg flex flex-wrap gap-x-6 gap-y-stack-sm border-t border-primary-fixed-dim/20 pt-stack-md">
            {[
              { icon: "fingerprint", label: t("hero.feature_one") },
              { icon: "translate", label: t("hero.feature_two") },
              { icon: "shield", label: t("hero.feature_three") },
            ].map((item) => (
              <li
                className="flex items-center gap-2 font-body-sm text-body-sm text-primary-fixed-dim"
                key={item.label}
              >
                <Icon className="text-[18px] text-primary-fixed" name={item.icon} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up [animation-delay:120ms] lg:justify-self-end">
          <AudiencePreview />
        </div>
      </div>
    </section>
  );
}

/**
 * A still of the audience builder, which is the product's signature moment.
 *
 * Shows the real interface rather than an abstract diagram, and carries a
 * "Preview" chip so the sample count is never mistaken for a claim about the
 * current size of the panel.
 */
function AudiencePreview() {
  const filters = [
    { label: "University", value: "Hawassa University" },
    { label: "Department", value: "Sociology" },
    { label: "Academic year", value: "Year 3" },
    { label: "Minimum tier", value: "Tier 2 · Attribute verified" },
  ];

  return (
    <div className="w-full max-w-md rounded-4xl border border-primary-fixed-dim/25 bg-primary-container/70 p-2 shadow-lifted backdrop-blur-sm">
      <div className="rounded-3xl bg-surface-container-lowest p-stack-md">
        <div className="flex items-center justify-between">
          <span className="font-title-sm text-title-sm text-on-surface">Audience</span>
          <span className="rounded-full bg-surface-container-high px-2 py-1 font-label-caps text-[10px] uppercase text-on-surface-variant">
            Preview
          </span>
        </div>

        <dl className="mt-stack-md space-y-stack-sm">
          {filters.map((filter) => (
            <div
              className="flex items-center justify-between gap-stack-sm rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2"
              key={filter.label}
            >
              <dt className="font-label-caps text-[10px] uppercase text-on-surface-variant">
                {filter.label}
              </dt>
              <dd className="truncate font-body-sm text-body-sm font-semibold text-on-surface">
                {filter.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-stack-md rounded-2xl bg-primary p-stack-md text-on-primary">
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg leading-none">342</span>
            <span className="font-body-sm text-body-sm text-primary-fixed-dim">matched</span>
          </div>
          <p className="mt-2 flex items-center gap-2 font-body-sm text-[13px] text-primary-fixed-dim">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-passed opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-passed" />
            </span>
            Updates as you change a filter
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: "tune",
      title: t("how_it_works.step1_title"),
      body: t("how_it_works.step1_body"),
    },
    {
      icon: "send",
      title: t("how_it_works.step2_title"),
      body: t("how_it_works.step2_body"),
    },
    {
      icon: "insights",
      title: t("how_it_works.step3_title"),
      body: t("how_it_works.step3_body"),
    },
  ];

  return (
    <section className="relative bg-surface px-margin-mobile py-20 md:px-gutter md:py-24" id="how">
      <div aria-hidden="true" className="dot-grid fade-bottom absolute inset-0 opacity-60" />

      <div className="relative mx-auto max-w-container-max">
        <SectionIntro
          eyebrow={t("how_it_works.eyebrow")}
          title={t("how_it_works.title")}
        />

        <ol className="mt-stack-lg grid gap-stack-md md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              className="group relative rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
              key={step.title}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary">
                  <Icon className="text-[22px]" name={step.icon} />
                </span>
                <span className="font-label-caps text-label-caps text-outline">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-stack-md font-title-sm text-title-sm text-on-surface">
                {step.title}
              </h3>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

function Capabilities() {
  const { t } = useLanguage();

  return (
    <section
      className="border-y border-outline-variant bg-surface-container-low px-margin-mobile py-20 md:px-gutter md:py-24"
      id="product"
    >
      <div className="mx-auto max-w-container-max">
        <SectionIntro
          eyebrow={t("capabilities.eyebrow")}
          title={t("capabilities.title")}
          subtitle={t("capabilities.subtitle")}
        />

        <div className="mt-stack-lg grid gap-stack-md lg:grid-cols-3">
          <article className="flex flex-col justify-between rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft lg:col-span-2">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                {t("capabilities.card1_title")}
              </h3>
              <p className="mt-stack-sm max-w-xl font-body-md text-body-md text-on-surface-variant">
                {t("capabilities.card1_body")}
              </p>
            </div>

            <ul className="mt-stack-lg grid gap-stack-sm sm:grid-cols-2">
              {[
                { icon: "timer", label: t("capabilities.signal_time") },
                { icon: "linear_scale", label: t("capabilities.signal_straightline") },
                { icon: "keyboard", label: t("capabilities.signal_typing") },
                { icon: "psychology_alt", label: t("capabilities.signal_consistency") },
              ].map((signal) => (
                <li
                  className="flex items-center gap-stack-sm rounded-2xl bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface"
                  key={signal.icon}
                >
                  <Icon className="text-[18px] text-primary" name={signal.icon} />
                  {signal.label}
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-stack-md">
            <CapabilityCard
              body={t("capabilities.fayda_body")}
              icon="fingerprint"
              title={t("capabilities.fayda_title")}
            />
            <CapabilityCard
              body={t("capabilities.data_rights_body")}
              icon="policy"
              title={t("capabilities.data_rights_title")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilityCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft transition-colors hover:border-primary/30">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container text-primary">
        <Icon className="text-[22px]" filled name={icon} />
      </span>
      <h3 className="mt-stack-md font-title-sm text-title-sm text-on-surface">{title}</h3>
      <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{body}</p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Verification ladder
// ---------------------------------------------------------------------------

const TIER_DETAIL: Record<VerificationTier, string> = {
  "0_registered": "Phone number confirmed. Excluded from verified matches by default.",
  "1_id_verified": "Fayda ID confirmed, so one person holds one account.",
  "2_attribute_verified": "A document backs up the claimed institution or employer.",
  "3_institution_attested": "A registrar or employer confirmed the affiliation directly.",
};

function VerificationLadder() {
  return (
    <section
      className="bg-surface px-margin-mobile py-20 md:px-gutter md:py-24"
      id="verification"
    >
      <div className="mx-auto grid max-w-container-max gap-stack-lg lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionIntro
            align="left"
            eyebrow="Verification"
            title="You choose how much proof your study needs"
          />
          <p className="mt-stack-md max-w-lg font-body-md text-body-md text-on-surface-variant">
            Each tier is a stronger claim about a respondent than the one below it, and
            you set the minimum when you build your audience. Raising it narrows the
            pool, which the matched count shows you immediately.
          </p>
          <Link className="mt-stack-md inline-block" to="/learn/researchers">
            <Button icon="arrow_forward" variant="outline">
              How verification works
            </Button>
          </Link>
        </div>

        <ol className="relative space-y-stack-sm">
          {VERIFICATION_TIERS.map((tier, index) => (
            <li
              className="flex items-start gap-stack-md rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-soft transition-all duration-300 hover:border-primary/30 hover:shadow-card"
              key={tier}
            >
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container font-label-caps text-label-caps text-primary">
                {index}
              </span>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface">
                  {TIER_LABEL[tier]}
                </p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {TIER_DETAIL[tier]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Audiences
// ---------------------------------------------------------------------------

function Audiences() {
  return (
    <section
      className="border-t border-outline-variant bg-surface-container-low px-margin-mobile py-20 md:px-gutter md:py-24"
      id="platform"
    >
      <div className="mx-auto max-w-container-max">
        <SectionIntro eyebrow="Two sides" title="Whichever side you are on" />

        <div className="mt-stack-lg grid gap-stack-md md:grid-cols-2">
          <AudienceCard
            bullets={[
              "Filterable demographics you can defend in review",
              "Quality signals on every response",
              "Amharic and Afan Oromo out of the box",
            ]}
            body="Reach a sample that matches your study, and see the count before you commit to anything."
            cta="/learn/researchers"
            ctaLabel="For researchers"
            icon="science"
            title="Researchers"
          />
          <AudienceCard
            bullets={[
              "Paid in ETB for honest effort",
              "Verify your identity once",
              "See exactly what was shared and when",
            ]}
            body="Answer studies that actually apply to you, and keep control of what a researcher gets to see."
            cta="/learn/respondents"
            ctaLabel="For respondents"
            icon="groups"
            title="Respondents"
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  title,
  icon,
  body,
  bullets,
  cta,
  ctaLabel,
}: {
  title: string;
  icon: string;
  body: string;
  bullets: string[];
  cta: string;
  ctaLabel: string;
}) {
  return (
    <article className="group flex h-full flex-col rounded-4xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card">
      <div className="flex items-center gap-stack-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary">
          <Icon className="text-[22px]" filled name={icon} />
        </span>
        <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
      </div>

      <p className="mt-stack-md font-body-md text-body-md text-on-surface-variant">{body}</p>

      <ul className="mt-stack-md flex-1 space-y-stack-sm">
        {bullets.map((bullet) => (
          <li
            className="flex items-start gap-stack-sm font-body-sm text-body-sm text-on-surface"
            key={bullet}
          >
            <Icon className="mt-px text-[18px] text-status-passed" name="check_circle" />
            {bullet}
          </li>
        ))}
      </ul>

      <Link
        className="mt-stack-lg inline-flex items-center gap-1 font-title-sm text-body-md font-semibold text-primary"
        to={cta}
      >
        {ctaLabel}
        <Icon
          className="text-[18px] transition-transform duration-300 group-hover:translate-x-1"
          name="arrow_forward"
        />
      </Link>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Closing CTA
// ---------------------------------------------------------------------------

function ClosingCta() {
  return (
    <section className="px-margin-mobile py-20 md:px-gutter md:py-24">
      <div className="relative mx-auto max-w-container-max overflow-hidden rounded-4xl bg-primary px-stack-lg py-16 text-center text-on-primary shadow-lifted">
        <div aria-hidden="true" className="hero-glow absolute inset-0" />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display-lg-mobile text-display-lg-mobile text-on-primary md:font-display-lg md:text-display-lg">
            Start with a sample you can trust
          </h2>
          <p className="mt-stack-md font-body-md text-body-md text-primary-fixed-dim">
            Create an account and build your first audience. You will see the matched
            count before you spend anything.
          </p>
          <div className="mt-stack-lg flex flex-wrap justify-center gap-stack-sm">
            <Link to="/signup">
              <Button
                className="bg-surface-container-lowest px-5 py-3 text-primary hover:bg-primary-fixed"
                icon="arrow_forward"
              >
                Create an account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                className="border border-primary-fixed-dim/40 px-5 py-3 text-primary-fixed-dim hover:border-primary-fixed-dim hover:bg-primary-fixed/10 hover:text-primary-fixed"
                variant="ghost"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function SectionIntro({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : ""}>
      <span className="font-label-caps text-label-caps uppercase text-primary">{eyebrow}</span>
      <h2 className="mt-2 font-headline-lg text-headline-lg text-on-surface">{title}</h2>
      {subtitle ? (
        <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
      ) : null}
    </div>
  );
}
