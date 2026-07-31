import { Link } from "react-router-dom";
import { PageHero, PageSection } from "@/components/marketing/PageHero";
import { Button, Icon, Notice } from "@/components/ui";
import { useLanguage } from "@/lib/language";

export function LearnRespondentsPage() {
  const { t } = useLanguage();

  const steps = [
    {
      icon: "person_add",
      title: "Register with your phone",
      body: "No email needed. Your phone number is your account.",
    },
    {
      icon: "fingerprint",
      title: t("capabilities.fayda_title"),
      body: t("capabilities.fayda_body"),
    },
    {
      icon: "badge",
      title: "Add your details",
      body: "Institution, department, year. This is what studies match against.",
    },
    {
      icon: "inbox",
      title: t("respondent.inbox_title"),
      body: t("respondent.inbox_subtitle"),
    },
  ];

  const rights = [
    "You can see every consent event recorded against your account.",
    "You can request deletion of your uploaded documents.",
    "Researchers see only the attributes a study filtered on — never your phone number.",
    "Your Fayda ID number is never stored, only an irreversible hash of it.",
  ];

  return (
    <>
      <PageHero
        actions={
          <Link to="/signup?role=respondent">
            <Button
              className="bg-surface-container-lowest px-5 py-3 text-primary hover:bg-primary-fixed"
              icon="how_to_reg"
            >
              {t("nav.join_respondent")}
            </Button>
          </Link>
        }
        eyebrow={t("nav.for_respondents")}
        title={t("audiences.respondent_title")}
      >
        <p>{t("audiences.respondent_body")}</p>
      </PageHero>

      <PageSection title={t("nav.how_it_works")}>
        <ol className="grid gap-stack-md md:grid-cols-2">
          {steps.map((step, index) => (
            <li
              className="flex gap-stack-md rounded-3xl border border-outline-variant bg-surface-container-lowest p-stack-lg shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
              key={step.title}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
                <Icon className="text-[22px]" name={step.icon} />
              </span>
              <div>
                <div className="flex items-center gap-stack-sm">
                  <h3 className="font-title-sm text-title-sm text-on-surface">{step.title}</h3>
                  <span className="font-label-caps text-label-caps text-outline">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection
        intro="Ethosk is built around Ethiopia's Personal Data Protection Proclamation No. 1321/2024."
        title="Your data, your rights"
        tone="raised"
      >
        <ul className="grid gap-stack-sm md:grid-cols-2">
          {rights.map((right) => (
            <li
              className="flex items-start gap-stack-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md font-body-sm text-body-sm text-on-surface shadow-soft"
              key={right}
            >
              <Icon className="mt-px text-[18px] text-status-passed" filled name="shield" />
              {right}
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="Getting paid">
        <div className="max-w-3xl">
          <Notice tone="info" title="Payouts during the pilot">
            Telebirr and CBE payouts are integrated at the pilot stage. Balances shown in
            the app during this build reflect earned rewards but are not yet withdrawable.
          </Notice>
        </div>
      </PageSection>
    </>
  );
}
