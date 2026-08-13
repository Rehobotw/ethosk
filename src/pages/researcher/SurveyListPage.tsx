import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SurveyRecord, SurveyStatus } from "@shared/types";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  LoadingBlock,
  Notice,
  SectionHeading,
} from "@/components/ui";
import { api } from "@/lib/api";

interface SurveyWithStats extends SurveyRecord {
  response_count: number;
  targeted_count: number;
}

const STATUS_STYLES: Record<SurveyStatus, string> = {
  draft: "bg-surface-container-high text-on-surface-variant",
  final_draft: "bg-primary/15 text-primary font-semibold",
  pending_review: "bg-secondary-container/60 text-secondary font-semibold",
  needs_correction: "bg-status-failed/15 text-error font-semibold",
  rejected: "bg-surface-variant text-on-surface-variant line-through",
  active: "bg-status-passed/15 text-flag-clean",
  closed: "bg-surface-variant text-on-surface-variant",
};

const STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: "Draft (WIP)",
  final_draft: "Final Draft",
  pending_review: "Pending Review",
  needs_correction: "Needs Revision",
  rejected: "Rejected",
  active: "Active",
  closed: "Closed",
};

export function SurveyListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  return (
    <div className="space-y-stack-md">
      <SectionHeading
        actions={
          <Link to="/researcher/surveys/new">
            <Button icon="add">Create New Survey</Button>
          </Link>
        }
        subtitle="Every survey you have created, with its current status and analytics."
        title="My Surveys"
      />

      {isLoading ? <LoadingBlock label="Loading your surveys…" /> : null}
      {error ? <Notice tone="error">Could not load your surveys.</Notice> : null}

      {data && data.surveys.length === 0 ? (
        <EmptyState icon="description" title="Nothing here yet">
          Your surveys will be listed here once you create one.
        </EmptyState>
      ) : null}

      <div className="space-y-stack-md">
        {data?.surveys.map((survey) => {
          const isEditable = survey.status === "draft" || survey.status === "final_draft" || survey.status === "needs_correction";
          const isLiveOrClosed = survey.status === "active" || survey.status === "closed";
          return (
            <Card className="p-stack-md" key={survey.id}>
              <div className="flex flex-wrap items-center justify-between gap-stack-md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-stack-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-status-badge text-status-badge ${
                        STATUS_STYLES[survey.status]
                      }`}
                    >
                      {STATUS_LABELS[survey.status] || survey.status}
                    </span>
                    <span className="font-body-sm text-[12px] text-on-surface-variant">
                      {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-stack-sm truncate font-title-sm text-title-sm text-on-surface">
                    {survey.title}
                  </h3>
                  <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
                    {survey.questions.length} question{survey.questions.length === 1 ? "" : "s"} ·{" "}
                    {survey.response_count} response{survey.response_count === 1 ? "" : "s"}
                    {survey.reward_etb ? ` · ${survey.reward_etb} ETB each` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-stack-sm">
                  {isEditable ? (
                    <Link to={`/researcher/surveys/${survey.id}/edit`}>
                      <Button icon="edit" variant="outline">
                        {survey.status === "needs_correction" ? "Revise & Resubmit" : "Continue Editing"}
                      </Button>
                    </Link>
                  ) : isLiveOrClosed ? (
                    <>
                      <Link to={`/researcher/surveys/${survey.id}/dashboard`}>
                        <Button icon="insights">
                          View Data & Graphs
                        </Button>
                      </Link>
                      <Link to={`/researcher/surveys/${survey.id}/edit`}>
                        <Button icon="visibility" variant="outline">
                          View Questions
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link to={`/researcher/surveys/${survey.id}/edit`}>
                      <Button icon="visibility" variant="outline">
                        View Submission
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-stack-lg flex items-center gap-stack-sm font-body-sm text-[12px] text-on-surface-variant">
        <Icon className="text-[16px]" name="lock" />
        Active surveys are locked from editing questions to preserve response integrity, but you can view questions or analyze response graphs anytime.
      </p>
    </div>
  );
}
