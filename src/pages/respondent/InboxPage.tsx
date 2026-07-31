import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TIER_RANK, type RespondentWallet } from "@shared/types";
import { Button, Card, EmptyState, Icon, LoadingBlock, Notice, TierBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

interface InboxSurvey {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  reward_etb: number;
}

export function InboxPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data, isLoading, error } = useQuery({
    queryKey: ["inbox"],
    queryFn: () => api<{ surveys: InboxSurvey[] }>("/respondents/inbox"),
  });

  const { data: wallet } = useQuery({
    queryKey: ["respondent-wallet"],
    queryFn: () => api<{ wallet: RespondentWallet }>("/wallet/respondent"),
  });

  const tierRank = user ? TIER_RANK[user.verification_tier] : 0;
  const needsVerification = tierRank < TIER_RANK["2_attribute_verified"];

  // Blank rather than 0.00 until the balance actually arrives: a respondent with
  // earnings should never be shown a zero the server did not send. The inbox
  // itself stays usable either way — surveys do not depend on this.
  const balance = wallet?.wallet.available_etb;

  return (
    <div className="space-y-stack-md">
      <Card className="bg-surface p-stack-md md:p-stack-lg">
        <div className="flex flex-col gap-stack-md sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-title-sm text-title-sm text-on-surface">
              {user?.full_name ?? "Respondent"}
            </p>
            {user ? (
              <div className="mt-stack-sm">
                <TierBadge tier={user.verification_tier} />
              </div>
            ) : null}
          </div>
          <div className="sm:text-right">
            <p className="mb-base font-label-caps text-label-caps uppercase text-on-surface-variant">
              {t("respondent.inbox_title")}
            </p>
            <Link className="font-title-sm text-title-sm text-primary hover:underline" to="/wallet">
              {typeof balance === "number" ? `${balance.toFixed(2)} ETB` : "—"}
            </Link>
          </div>
        </div>

        {needsVerification ? (
          <div className="mt-stack-md border-t border-outline-variant pt-stack-md">
            <p className="mb-stack-sm font-body-sm text-body-sm text-on-surface-variant">
              Unlock higher-paying surveys by completing verification.
            </p>
            <Link className="group flex items-center justify-between sm:justify-start sm:gap-stack-sm" to="/verify">
              <span className="font-title-sm text-title-sm text-secondary hover:underline">
                Complete Verification
              </span>
              <Icon
                className="text-secondary transition-transform group-hover:translate-x-1"
                name="arrow_forward"
              />
            </Link>
          </div>
        ) : null}
      </Card>

      <section>
        <h2 className="mb-stack-md font-headline-md text-headline-md text-primary">
          Available Surveys
        </h2>

        {isLoading ? <LoadingBlock label="Checking for tasks…" /> : null}

        {error ? (
          <Notice tone="error">Could not load your inbox. Pull down to refresh.</Notice>
        ) : null}

        {data && data.surveys.length === 0 ? (
          <EmptyState icon="inbox" title="No surveys waiting">
            {needsVerification
              ? "Complete verification to start matching with studies."
              : "You have answered everything matched to you. New studies will appear here."}
          </EmptyState>
        ) : null}

        <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-3">
          {data?.surveys.map((survey) => (
            <Card
              className="trust-glow flex flex-col overflow-hidden bg-surface"
              key={survey.id}
            >
              <div className="flex flex-1 flex-col p-stack-md">
                <div className="mb-stack-sm flex items-start justify-between gap-stack-sm">
                  <h3 className="font-title-sm text-title-sm text-primary">{survey.title}</h3>
                  <span className="shrink-0 whitespace-nowrap rounded bg-primary-fixed px-2 py-1 font-label-caps text-label-caps text-primary">
                    {survey.reward_etb} ETB
                  </span>
                </div>

                {survey.description ? (
                  <p className="mb-stack-sm line-clamp-3 font-body-sm text-body-sm text-on-surface-variant">
                    {survey.description}
                  </p>
                ) : null}

                <div className="mb-stack-md mt-auto flex items-center gap-stack-sm text-on-surface-variant">
                  <Icon className="text-sm" name="schedule" />
                  <span className="font-body-sm text-body-sm">
                    ~{survey.estimated_minutes} min{survey.estimated_minutes === 1 ? "" : "s"}
                  </span>
                </div>

                <Link to={`/surveys/${survey.id}/fill`}>
                  <Button className="w-full py-3 active:scale-95">Start Survey</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
