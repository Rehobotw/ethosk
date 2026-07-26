import { EmptyState, Notice } from "@/components/ui";

export function HistoryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-stack-md">
      <div>
        <h1 className="font-headline-md text-headline-md text-primary">History</h1>
        <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
          Surveys you have completed.
        </p>
      </div>

      <Notice tone="info">
        A respondent cannot see the quality flag on their own response. Showing it would tell a
        bad-faith respondent exactly which behaviour got caught, which is the one thing the check
        depends on not revealing.
      </Notice>

      <EmptyState icon="history" title="Completed surveys appear here">
        Once a study closes, your accepted responses and their rewards are listed on this screen.
      </EmptyState>
    </div>
  );
}
