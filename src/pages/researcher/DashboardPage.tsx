import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import { Button, Card, EmptyState, Icon, LoadingBlock, Notice, SectionHeading } from "@/components/ui";
import { api } from "@/lib/api";

interface SurveyWithStats extends SurveyRecord {
  response_count: number;
  targeted_count: number;
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  const active = data?.surveys.filter((survey) => survey.status === "active") ?? [];
  const drafts = data?.surveys.filter((survey) => survey.status === "draft") ?? [];

  return (
    <div>
      <SectionHeading
        actions={
          <Link to="/researcher/surveys/new">
            <Button icon="add">Create New Survey</Button>
          </Link>
        }
        subtitle="Manage your surveys and high-trust verified responses."
        title="Researcher Dashboard"
      />

      {isLoading ? <LoadingBlock label="Loading your surveys…" /> : null}
      {error ? <Notice tone="error">Could not load your surveys.</Notice> : null}

      {data && data.surveys.length === 0 ? (
        <EmptyState icon="science" title="No surveys yet">
          Create your first survey to define questions, pick an audience, and see a live matched count
          before you send anything.
        </EmptyState>
      ) : null}

      {active.length > 0 ? (
        <section className="mb-stack-lg">
          <h2 className="mb-stack-md flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
            <Icon className="text-secondary" name="bolt" /> Active Surveys
          </h2>
          <div className="space-y-stack-md">
            {active.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        </section>
      ) : null}

      {drafts.length > 0 ? (
        <section>
          <h2 className="mb-stack-md flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
            <Icon className="text-on-surface-variant" name="edit_note" /> Drafts
          </h2>
          <div className="space-y-stack-md">
            {drafts.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SurveyCard({ survey }: { survey: SurveyWithStats }) {
  const isDraft = survey.status === "draft";
  const completion =
    survey.targeted_count > 0
      ? Math.round((survey.response_count / survey.targeted_count) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-stack-md p-stack-md md:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            {isDraft
              ? "Draft"
              : `Sent ${survey.sent_at ? new Date(survey.sent_at).toLocaleDateString() : ""}`}
          </p>
          <h3 className="mt-base font-title-sm text-title-sm text-on-surface">{survey.title}</h3>

          <div className="mt-stack-md flex flex-wrap gap-stack-lg">
            <div>
              <p className="font-label-caps text-[11px] uppercase text-on-surface-variant">
                Responses
              </p>
              <p className="mt-base font-headline-md text-title-sm text-on-surface">
                {survey.response_count}
                {survey.targeted_count > 0 ? (
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {" "}
                    / {survey.targeted_count}
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <p className="font-label-caps text-[11px] uppercase text-on-surface-variant">
                Completion
              </p>
              <p className="mt-base font-headline-md text-title-sm text-on-surface">
                {completion}%
              </p>
            </div>
            <div>
              <p className="font-label-caps text-[11px] uppercase text-on-surface-variant">
                Questions
              </p>
              <p className="mt-base font-headline-md text-title-sm text-on-surface">
                {survey.questions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-stack-sm">
          {isDraft ? (
            <Link to={`/researcher/surveys/${survey.id}/edit`}>
              <Button className="w-full" icon="edit">
                Continue editing
              </Button>
            </Link>
          ) : (
            <>
              <Link to={`/researcher/surveys/${survey.id}/dashboard`}>
                <Button className="w-full" icon="insights">
                  View Data
                </Button>
              </Link>
              <Link to={`/researcher/surveys/${survey.id}/edit`}>
                <Button className="w-full" variant="outline">
                  View questions
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
