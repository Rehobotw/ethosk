import { Link } from "react-router-dom";
import clsx from "clsx";
import { TIER_RANK, type VerificationTier } from "@shared/types";
import { Button, Card, Icon, TierBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { FaydaVerifyForm } from "./FaydaVerifyForm";

const STEPS: {
  tier: VerificationTier;
  title: string;
  body: string;
  icon: string;
}[] = [
  {
    tier: "0_registered",
    title: "Registered",
    body: "Your email address is confirmed.",
    icon: "mail",
  },
  {
    tier: "1_id_verified",
    title: "Fayda ID verified",
    body: "Confirms you are one real person. Unlocks most studies.",
    icon: "fingerprint",
  },
  {
    tier: "2_attribute_verified",
    title: "Attribute verified",
    body: "A supporting document backs up your institution or employer.",
    icon: "badge",
  },
  {
    tier: "3_institution_attested",
    title: "Institution attested",
    body: "Confirmed directly by a registrar or employer. Coming with the pilot.",
    icon: "verified",
  },
];

export function VerificationPage() {
  const { user, refresh } = useAuth();
  const currentRank = user ? TIER_RANK[user.verification_tier] : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-stack-md">
      <div>
        <h1 className="font-headline-md text-headline-md text-primary">Verification</h1>
        <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
          Each step unlocks better-paid studies. You only ever verify once.
        </p>
      </div>

      {user ? (
        <Card className="flex items-center justify-between p-stack-md">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Current status</span>
          <TierBadge tier={user.verification_tier} />
        </Card>
      ) : null}

      <ol className="space-y-stack-md">
        {STEPS.map((step) => {
          const rank = TIER_RANK[step.tier];
          const done = currentRank >= rank;
          const isNext = currentRank === rank - 1;

          return (
            <li key={step.tier}>
              <Card
                className={clsx(
                  "p-stack-md",
                  done && "border-status-passed/40 bg-status-passed/5",
                  isNext && "border-primary",
                )}
              >
                <div className="flex items-start gap-stack-md">
                  <span
                    className={clsx(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      done
                        ? "bg-status-passed/15 text-status-passed"
                        : "bg-surface-container-high text-on-surface-variant",
                    )}
                  >
                    <Icon filled={done} name={done ? "check" : step.icon} />
                  </span>

                  <div className="flex-1">
                    <p className="font-title-sm text-title-sm text-on-surface">{step.title}</p>
                    <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
                      {step.body}
                    </p>

                    {step.tier === "1_id_verified" && !done ? (
                      <FaydaVerifyForm onVerified={refresh} />
                    ) : null}

                    {step.tier === "2_attribute_verified" && !done ? (
                      <Link className="mt-stack-md inline-block" to="/documents">
                        <Button icon="upload" variant="outline">
                          Upload a document
                        </Button>
                      </Link>
                    ) : null}

                    {step.tier === "3_institution_attested" && !done ? (
                      <p className="mt-stack-sm font-label-caps text-label-caps uppercase text-on-surface-variant">
                        Not available in this build
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
