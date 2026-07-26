import { Link } from "react-router-dom";
import { PageHero, PageSection } from "@/components/marketing/PageHero";
import { Button, Icon, Notice } from "@/components/ui";

const STEPS = [
  {
    icon: "person_add",
    title: "Register with your phone",
    body: "No email needed. Your phone number is your account.",
  },
  {
    icon: "fingerprint",
    title: "Verify once with Fayda",
    body: "Enter your Fayda ID number and we check it with Fayda. Confirms you are a real, single person, and unlocks better-paid studies.",
  },
  {
    icon: "badge",
    title: "Add your details",
    body: "Institution, department, year. This is what studies match against.",
  },
  {
    icon: "inbox",
    title: "Answer matched surveys",
    body: "Only studies you actually qualify for reach your inbox.",
  },
];

const RIGHTS = [
  "You can see every consent event recorded against your account.",
  "You can request deletion of your uploaded documents.",
  "Researchers see only the attributes a study filtered on — never your phone number.",
  "Your Fayda ID number is never stored, only an irreversible hash of it.",
];

export function LearnRespondentsPage() {
  return (
    <>
      <PageHero
        actions={
          <Link to="/signup?role=respondent">
            <Button
              className="bg-surface-container-lowest px-5 py-3 text-primary hover:bg-primary-fixed"
              icon="how_to_reg"
            >
              Join the panel
            </Button>
          </Link>
        }
        eyebrow="For respondents"
        title="Get paid for honest answers"
      >
        <p>
          Most paid-survey apps do not pay in Ethiopia, do not speak Amharic or Afan
          Oromo, and never tell you what happens to your answers. Ethosk pays in ETB,
          works in your language, and logs exactly what you consented to.
        </p>
      </PageHero>

      <PageSection title="How it works">
        <ol className="grid gap-stack-md md:grid-cols-2">
          {STEPS.map((step, index) => (
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
          {RIGHTS.map((right) => (
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
