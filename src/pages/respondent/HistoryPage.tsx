import { useQuery } from "@tanstack/react-query";
import { Card, EmptyState, Icon, LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";

interface HistoryItem {
  id: string;
  survey_id: string;
  title: string;
  reward_etb: number;
  completed_at: string;
}

export function HistoryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["respondent-history"],
    queryFn: () => api<{ history: HistoryItem[] }>("/respondents/history"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-stack-md">
      <div>
        <h1 className="font-headline-md text-headline-md text-primary">History</h1>
        <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
          Surveys you have completed and submitted.
        </p>
      </div>

      <Notice tone="info">
        A respondent cannot see the quality flag on their own response. Showing it would tell a
        bad-faith respondent exactly which behaviour got caught, which is the one thing the check
        depends on not revealing.
      </Notice>

      {isLoading ? <LoadingBlock label="Loading completed surveys…" /> : null}
      {error ? <Notice tone="error">Could not load your history.</Notice> : null}

      {data && data.history.length === 0 ? (
        <EmptyState icon="history" title="Completed surveys appear here">
          Once you complete a study, your submission record and reward details will appear here.
        </EmptyState>
      ) : null}

      {data && data.history.length > 0 ? (
        <div className="space-y-stack-sm">
          {data.history.map((item) => (
            <Card className="p-stack-md" key={item.id}>
              <div className="flex items-center justify-between gap-stack-md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="text-[18px] text-status-passed" name="check_circle" />
                    <span className="font-body-sm text-[12px] text-on-surface-variant">
                      Completed {new Date(item.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-stack-sm truncate font-title-sm text-title-sm text-on-surface">
                    {item.title}
                  </h3>
                </div>
                <div className="shrink-0">
                  <span className="rounded bg-primary-fixed px-2.5 py-1 font-label-caps text-label-caps text-primary font-semibold">
                    +{item.reward_etb} ETB
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
