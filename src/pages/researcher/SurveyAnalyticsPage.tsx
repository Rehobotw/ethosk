import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FraudFlag, FraudSignals, Question } from "@shared/types";
import { MIN_RESPONSES_FOR_SUMMARY } from "@shared/analytics/aggregate";
import { SIGNAL_LABELS } from "@shared/fraud/score";
import {
  Button,
  Card,
  EmptyState,
  FlagBadge,
  Icon,
  LoadingBlock,
  Notice,
  SectionHeading,
  StatBlock,
  Toggle,
} from "@/components/ui";
import { api } from "@/lib/api";

interface Analytics {
  response_count: number;
  targeted_count: number;
  completion_rate: number;
  flagged_count: number;
  clean_count: number;
  distributions: Record<string, Record<string, number>>;
  ai_summary: string[] | null;
  questions: Question[];
}

interface ResponseRow {
  id: string;
  total_time_seconds: number;
  fraud_flag: FraudFlag;
  fraud_signals: FraudSignals | null;
  completed_at: string;
}

const FLAG_COLORS: Record<FraudFlag, string> = {
  clean: "#10b981",
  flagged: "#ef4444",
};

export function SurveyAnalyticsPage() {
  const { id = "" } = useParams();
  const location = useLocation() as { state?: { justSent?: number } };
  const [includeFlagged, setIncludeFlagged] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", id, includeFlagged],
    queryFn: () =>
      api<Analytics>(`/surveys/${id}/analytics${includeFlagged ? "?include_flagged=true" : ""}`),
  });

  const { data: responses } = useQuery({
    queryKey: ["responses", id],
    queryFn: () => api<{ responses: ResponseRow[] }>(`/surveys/${id}/responses`),
  });

  if (isLoading) return <LoadingBlock label="Building the dashboard…" />;
  if (error || !data) return <Notice tone="error">Could not load this survey&rsquo;s data.</Notice>;

  const flagged = (responses?.responses ?? []).filter((row) => row.fraud_flag === "flagged");

  const flagBreakdown = [
    { name: "Clean", value: data.clean_count, flag: "clean" as FraudFlag },
    { name: "Flagged", value: data.flagged_count, flag: "flagged" as FraudFlag },
  ].filter((entry) => entry.value > 0);

  return (
    <div>
      <SectionHeading
        actions={
          <Link to="/researcher">
            <Button icon="arrow_back" variant="outline">
              All surveys
            </Button>
          </Link>
        }
        subtitle="Response quality, distributions, and what the numbers actually show."
        title="Survey Management & Insights"
      />

      {location.state?.justSent !== undefined ? (
        <div className="mb-stack-md">
          <Notice tone="success" title="Survey sent">
            Delivered to {location.state.justSent} matched respondent
            {location.state.justSent === 1 ? "" : "s"}.
          </Notice>
        </div>
      ) : null}

      <div className="mb-stack-md grid gap-stack-md md:grid-cols-4">
        <StatBlock label="Responses" value={data.response_count} />
        <StatBlock label="Targeted" value={data.targeted_count} />
        <StatBlock label="Completion" value={`${Math.round(data.completion_rate * 100)}%`} />
        <StatBlock
          label="Flagged"
          tone={data.flagged_count > 0 ? "danger" : "default"}
          value={data.flagged_count}
        />
      </div>

      <Card className="mb-stack-md bg-primary p-stack-md text-on-primary">
        <h2 className="flex items-center gap-stack-sm font-title-sm text-title-sm">
          <Icon filled name="auto_awesome" /> AI Analytics Summary
        </h2>

        {data.ai_summary ? (
          <ul className="mt-stack-md space-y-stack-sm">
            {data.ai_summary.map((bullet, index) => (
              <li className="flex gap-stack-sm font-body-sm text-body-sm" key={index}>
                <Icon className="mt-0.5 text-[16px] text-secondary-fixed" name="lightbulb" />
                <span className="text-primary-fixed">{bullet}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-stack-sm font-body-sm text-body-sm text-primary-fixed-dim">
            {data.response_count < MIN_RESPONSES_FOR_SUMMARY
              ? `Not enough responses yet for a summary — at least ${MIN_RESPONSES_FOR_SUMMARY} are needed to say anything meaningful.`
              : "The summary could not be generated for this load. The figures above are unaffected."}
          </p>
        )}
      </Card>

      <div className="mb-stack-md grid gap-stack-md lg:grid-cols-3">
        <Card className="p-stack-md lg:col-span-2">
          <div className="mb-stack-md flex flex-wrap items-center justify-between gap-stack-sm">
            <h2 className="font-title-sm text-title-sm text-on-surface">Response distributions</h2>
            <Toggle
              checked={includeFlagged}
              label="Include flagged responses"
              onChange={setIncludeFlagged}
            />
          </div>

          {!includeFlagged && data.flagged_count > 0 ? (
            <p className="mb-stack-md font-body-sm text-[12px] text-on-surface-variant">
              {data.flagged_count} flagged response{data.flagged_count === 1 ? " is" : "s are"}{" "}
              excluded from these charts.
            </p>
          ) : null}

          {data.response_count === 0 ? (
            <EmptyState icon="bar_chart" title="No responses yet">
              Charts appear as soon as the first response arrives.
            </EmptyState>
          ) : (
            <div className="space-y-stack-lg">
              {data.questions
                .filter((question) => question.type !== "text")
                .map((question) => {
                  const buckets = data.distributions[question.id] ?? {};
                  const chartData = Object.entries(buckets).map(([option, count]) => ({
                    option,
                    count,
                  }));

                  return (
                    <div key={question.id}>
                      <p className="mb-stack-sm font-body-md text-body-md text-on-surface">
                        {question.text}
                      </p>
                      <div className="h-56">
                        <ResponsiveContainer height="100%" width="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid stroke="#c0c7cd" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="option"
                              stroke="#40484c"
                              style={{ fontSize: 12 }}
                              tickLine={false}
                            />
                            <YAxis allowDecimals={false} stroke="#40484c" style={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#003345" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}

              {data.questions.every((question) => question.type === "text") ? (
                <Notice tone="info">
                  This survey has only free-text questions, which are not charted. Read them in the
                  response list below.
                </Notice>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="p-stack-md">
          <h2 className="mb-stack-md font-title-sm text-title-sm text-on-surface">
            Fraud &amp; quality
          </h2>

          {flagBreakdown.length === 0 ? (
            <EmptyState icon="donut_small" title="Nothing to show yet" />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={flagBreakdown}
                      dataKey="value"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {flagBreakdown.map((entry) => (
                        <Cell fill={FLAG_COLORS[entry.flag]} key={entry.flag} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <dl className="mt-stack-md space-y-stack-sm">
                {flagBreakdown.map((entry) => (
                  <div className="flex items-center justify-between" key={entry.flag}>
                    <dt>
                      <FlagBadge flag={entry.flag} />
                    </dt>
                    <dd className="font-headline-md text-title-sm text-on-surface">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Card>
      </div>

      <Card className="p-stack-md">
        <h2 className="mb-stack-md font-title-sm text-title-sm text-on-surface">
          Flagged responses
        </h2>
        <p className="-mt-stack-sm mb-stack-md font-body-sm text-body-sm text-on-surface-variant">
          Flagged responses are excluded from the charts above unless you include
          them. The checks that tripped are listed per response; nothing here is
          AI-written.
        </p>

        {flagged.length === 0 ? (
          <EmptyState icon="verified" title="No response was flagged">
            Nothing tripped the timing, straight-lining, typing, or consistency checks.
          </EmptyState>
        ) : (
          <ul className="space-y-stack-md">
            {flagged.map((response) => (
              <li
                className="rounded-xl border border-outline-variant bg-surface-subtle p-stack-md"
                key={response.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-stack-sm">
                  <FlagBadge flag={response.fraud_flag} />
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    {new Date(response.completed_at).toLocaleString()}
                  </span>
                </div>

                {response.fraud_signals ? (
                  <>
                    <ul className="mt-stack-sm space-y-1">
                      {response.fraud_signals.tripped.map((signal) => (
                        <li
                          className="flex items-center gap-stack-sm font-body-md text-body-md text-on-surface"
                          key={signal}
                        >
                          <Icon className="text-[16px] text-flag-fraud" name="close" />
                          {SIGNAL_LABELS[signal] ?? signal}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-stack-md grid grid-cols-2 gap-stack-sm md:grid-cols-4">
                      <StatBlock
                        label="Time taken"
                        value={`${response.fraud_signals.total_time_seconds}s`}
                      />
                      <StatBlock
                        label="Expected min"
                        value={`${response.fraud_signals.expected_min_seconds}s`}
                      />
                      <StatBlock
                        label="Identical answers"
                        value={`${Math.round(response.fraud_signals.straight_line_ratio * 100)}%`}
                      />
                      <StatBlock
                        label="Typing speed"
                        value={
                          response.fraud_signals.max_typing_chars_per_second === null
                            ? "n/a"
                            : `${response.fraud_signals.max_typing_chars_per_second} c/s`
                        }
                      />
                    </div>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
