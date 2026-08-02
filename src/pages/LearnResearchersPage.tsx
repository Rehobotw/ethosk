import { Link } from "react-router-dom";
import { TIER_LABEL, VERIFICATION_TIERS, type VerificationTier } from "@shared/types";
import { PageHero, PageSection } from "@/components/marketing/PageHero";
import { Button, Icon, Notice } from "@/components/ui";
import { useLanguage } from "@/lib/language";

const TIER_DETAIL: Record<VerificationTier, string> = {
  "0_registered": "Email address confirmed. Not included in any verified match by default.",
  "1_id_verified": "Identity confirmed against Fayda, so one person holds one account.",
  "2_attribute_verified":
    "A supporting document passed a legibility and consistency check against the claimed profile.",
  "3_institution_attested":
    "A university registrar or employer confirmed the affiliation directly.",
};

const SIGNALS = [
  {
    icon: "timer",
    title: "Time per question",
    body: "Captured on focus and blur for each question, then reconciled server-side. No countdown is shown to the respondent, so it cannot be paced against.",
  },
  {
    icon: "linear_scale",
    title: "Straight-line ratio",
    body: "The share of answers that are identical. A high ratio on a long survey indicates a respondent clicking through without reading.",
  },
  {
    icon: "psychology_alt",
    title: "Consistency check",
    body: "One of your early questions is reworded and asked again at a random position later on. Answering the two differently is self-contradiction, and flags on its own.",
  },
  {
    icon: "keyboard",
    title: "Typing on long answers",
    body: "For long written answers we compare keystrokes and typing pace against the text produced, so an answer that was pasted rather than composed is visible.",
  },
];

export function LearnResearchersPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        actions={
          <>
            <Link to="/signup">
              <Button
                className="bg-surface-container-lowest px-5 py-3 text-primary hover:bg-primary-fixed"
                icon="arrow_forward"
              >
                {t("closing_cta.btn_signup")}
              </Button>
            </Link>
            <Link to="/learn/respondents">
              <Button
                className="border border-primary-fixed-dim/40 px-5 py-3 text-primary-fixed-dim hover:border-primary-fixed-dim hover:bg-primary-fixed/10 hover:text-primary-fixed"
                variant="ghost"
              >
                {t("audiences.respondent_cta")}
              </Button>
            </Link>
          </>
        }
        eyebrow={t("nav.for_researchers")}
        title={t("audiences.researcher_title")}
      >
        <p>{t("audiences.researcher_body")}</p>
      </PageHero>

      <PageSection
        intro="You set the minimum tier your study requires, and the matched count updates live as you raise or lower it. Each tier is a stronger claim about a respondent than the one below."
        title="Verification tiers"
      >
        <div className="grid gap-stack-md md:grid-cols-2">
          {VERIFICATION_TIERS.map((tier, index) => (
            <article
              className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
              key={tier}
            >
              <div className="flex items-center gap-stack-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-label-caps text-label-caps text-on-primary">
                  {index}
                </span>
                <h3 className="font-title-sm text-title-sm text-on-surface">
                  {TIER_LABEL[tier]}
                </h3>
              </div>
              <p className="mt-stack-md font-body-sm text-body-sm text-on-surface-variant">
                {TIER_DETAIL[tier]}
              </p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection
        intro={
          <p>
            Every flag comes from a deterministic rule set with no AI in it, and there are
            only two outcomes: flagged or not. You see the checks that tripped and the
            numbers behind them, never a model&rsquo;s opinion. The two weakest signals
            &mdash; speed and repetition &mdash; never flag on their own, only together.
          </p>
        }
        title="How response quality is judged"
        tone="raised"
      >
        <div className="grid gap-stack-md md:grid-cols-2">
          {SIGNALS.map((signal) => (
            <article
              className="rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft transition-colors hover:border-primary/30"
              key={signal.title}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container text-primary">
                <Icon className="text-[22px]" name={signal.icon} />
              </span>
              <h3 className="mt-stack-md font-title-sm text-title-sm text-on-surface">
                {signal.title}
              </h3>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                {signal.body}
              </p>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection title="What we do not claim">
        <div className="max-w-3xl">
          <Notice tone="warning" title="Document checks are not forgery detection">
            An uploaded document is checked for legibility and for consistency with the
            profile it claims to belong to. That is not the same as authenticating it, and
            we never describe it that way. Closing that gap needs institutional
            attestation, which is Tier 3 and is on the roadmap rather than live today.
          </Notice>
        </div>
      </PageSection>
    </>
  );
}
