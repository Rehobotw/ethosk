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
import { useAuth } from "@/lib/auth";

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

const BAR_COLORS = ["#0284c7", "#0d9488", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b"];

const FLAG_COLORS: Record<FraudFlag, string> = {
  clean: "#10b981",
  flagged: "#ef4444",
};

export function SurveyAnalyticsPage() {
  const { user } = useAuth();
  const { id = "" } = useParams();
  const location = useLocation() as { state?: { justSent?: number } };
  const [includeFlagged, setIncludeFlagged] = useState(false);

  const isSubscribed = user?.subscription_tier === "subscribed";

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", id, includeFlagged],
    queryFn: () =>
      api<Analytics>(`/surveys/${id}/analytics${includeFlagged ? "?include_flagged=true" : ""}`),
  });

  const { data: responses } = useQuery({
    queryKey: ["responses", id],
    queryFn: () => api<{ responses: ResponseRow[] }>(`/surveys/${id}/responses`),
  });

  if (isLoading) return <LoadingBlock label="Building survey insights & interactive charts…" />;
  if (error || !data) return <Notice tone="error">Could not load this survey&rsquo;s analytics data.</Notice>;

  const flagged = (responses?.responses ?? []).filter((row) => row.fraud_flag === "flagged");

  const flagBreakdown = [
    { name: "Clean", value: data.clean_count, flag: "clean" as FraudFlag },
    { name: "Flagged", value: data.flagged_count, flag: "flagged" as FraudFlag },
  ].filter((entry) => entry.value > 0);

  // Generate automated insights if missing
  const generatedSummary = data.ai_summary ?? [
    `Collected ${data.response_count} verified response${data.response_count === 1 ? "" : "s"} out of ${data.targeted_count} targeted participants (${Math.round(data.completion_rate * 100)}% completion rate).`,
    `${data.clean_count} responses (${data.response_count > 0 ? Math.round((data.clean_count / data.response_count) * 100) : 100}%) passed all deterministic fraud & speed checks.`,
    data.flagged_count > 0
      ? `${data.flagged_count} response${data.flagged_count === 1 ? " was" : "s were"} flagged by automated consistency and timing rules.`
      : "Zero responses flagged. All participants demonstrated genuine reading and response patterns.",
  ];

  return (
    <div className="space-y-stack-lg">
      <SectionHeading
        actions={
          <div className="flex items-center gap-2">
            {!isSubscribed ? (
              <Link to="/researcher/subscription">
                <Button icon="lock" variant="outline" title="Upgrade to Pro to export data">
                  Export Data
                </Button>
              </Link>
            ) : (
              <Button icon="download" variant="outline" onClick={() => alert("Export feature coming soon!")}>
                Export Data
              </Button>
            )}
            <Link to="/researcher">
              <Button icon="arrow_back" variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        }
        subtitle="Live response breakdown, interactive graphs, and deterministic data quality metrics."
        title="Survey Insights & Analytics"
      />

      {location.state?.justSent !== undefined ? (
        <Notice tone="success" title="Survey successfully launched">
          Delivered to {location.state.justSent} matched respondent
          {location.state.justSent === 1 ? "" : "s"}. Live data will populate as responses arrive.
        </Notice>
      ) : null}

      {/* Top Stat Overview */}
      <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Total Responses" value={data.response_count} />
        <StatBlock label="Targeted Participants" value={data.targeted_count} />
        <StatBlock label="Completion Rate" value={`${Math.round(data.completion_rate * 100)}%`} />
        <StatBlock
          label="Flagged Responses"
          tone={data.flagged_count > 0 ? "danger" : "default"}
          value={data.flagged_count}
        />
      </div>

      {/* AI Key Insights Summary Card */}
      <Card className="relative overflow-hidden bg-primary p-stack-md text-on-primary shadow-lifted">
        <h2 className="flex items-center gap-stack-sm font-title-sm text-title-sm">
          <Icon filled name="auto_awesome" /> Key Insights & Analytics Summary
        </h2>
        
        <div className={isSubscribed ? "mt-stack-md" : "mt-stack-md blur-sm opacity-50 select-none pointer-events-none"}>
          <ul className="space-y-stack-sm">
            {generatedSummary.map((bullet, index) => (
              <li className="flex items-start gap-stack-sm font-body-sm text-body-sm" key={index}>
                <Icon className="mt-0.5 text-[16px] text-secondary-fixed shrink-0" name="lightbulb" />
                <span className="text-primary-fixed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {!isSubscribed && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/40 backdrop-blur-[2px]">
            <Icon name="lock" className="text-3xl text-primary-fixed mb-2" />
            <h3 className="font-title-sm text-title-sm text-primary-fixed mb-1">
              Ethosk Pro Required
            </h3>
            <p className="font-body-sm text-body-sm text-primary-fixed max-w-sm text-center mb-4">
              Upgrade to the Pro tier to unlock automated AI insights and advanced analytics exports.
            </p>
            <Link to="/researcher/subscription">
              <Button variant="outline" className="bg-primary-fixed text-on-primary-fixed border-none hover:bg-primary-fixed-dim">
                Upgrade Now
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Main Visual Graphs Grid */}
      <div className="grid gap-stack-md lg:grid-cols-3">
        {/* Response Distribution Bar Charts */}
        <Card className="p-stack-md lg:col-span-2 space-y-stack-lg">
          <div className="flex flex-wrap items-center justify-between gap-stack-sm border-b border-outline-variant pb-stack-sm">
            <div>
              <h2 className="font-title-sm text-title-sm text-on-surface">Question Distributions & Charts</h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">Visual distribution of respondent answers</p>
            </div>
            <Toggle
              checked={includeFlagged}
              label="Include flagged responses"
              onChange={setIncludeFlagged}
            />
          </div>

          {!includeFlagged && data.flagged_count > 0 ? (
            <Notice tone="info">
              {data.flagged_count} flagged response{data.flagged_count === 1 ? " is" : "s are"} excluded from these charts to preserve data cleanliness.
            </Notice>
          ) : null}

          {data.response_count === 0 ? (
            <EmptyState icon="bar_chart" title="No responses collected yet">
              Charts will update automatically as soon as responses arrive.
            </EmptyState>
          ) : (
            <div className="space-y-8 divide-y divide-outline-variant/60">
              {data.questions
                .filter((question) => question.type !== "text")
                .map((question, qIdx) => {
                  const buckets = data.distributions[question.id] ?? {};
                  const total = Object.values(buckets).reduce((a, b) => a + b, 0);
                  const chartData = Object.entries(buckets).map(([option, count]) => ({
                    option,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                  }));

                  return (
                    <div className={qIdx > 0 ? "pt-6" : ""} key={question.id}>
                      <div className="mb-stack-sm flex items-start justify-between gap-4">
                        <p className="font-title-sm text-body-md text-on-surface">
                          <span className="font-semibold text-primary">Q{qIdx + 1}.</span> {question.text}
                        </p>
                        <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 font-label-caps text-[11px] font-semibold text-primary">
                          {total} answers
                        </span>
                      </div>

                      <div className="h-64 w-full mt-3">
                        <ResponsiveContainer height="100%" width="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis
                              dataKey="option"
                              interval={0}
                              stroke="#475569"
                              style={{ fontSize: 11 }}
                              tickLine={false}
                            />
                            <YAxis allowDecimals={false} stroke="#475569" style={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(
                                value: number,
                                _name: string,
                                // Recharts treats the datum as optional, so the
                                // share is appended only when it is actually there.
                                item: { payload?: { percentage?: number } },
                              ) => [
                                `${value} response${value === 1 ? "" : "s"}` +
                                  (item.payload?.percentage === undefined
                                    ? ""
                                    : ` (${item.payload.percentage}%)`),
                                "Count",
                              ]}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                              {chartData.map((_entry, index) => (
                                <Cell fill={BAR_COLORS[index % BAR_COLORS.length]} key={`cell-${index}`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}

              {data.questions.every((question) => question.type === "text") ? (
                <Notice tone="info">
                  This survey contains open-ended text questions. Read individual text responses below.
                </Notice>
              ) : null}
            </div>
          )}
        </Card>

        {/* Quality & Fraud Distribution Pie Chart */}
        <Card className="p-stack-md flex flex-col justify-between">
          <div>
            <div className="mb-stack-md border-b border-outline-variant pb-stack-sm">
              <h2 className="font-title-sm text-title-sm text-on-surface">
                Data Quality Breakdown
              </h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant">Deterministic quality screening</p>
            </div>

            {flagBreakdown.length === 0 ? (
              <EmptyState icon="donut_small" title="No data to analyze yet" />
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={flagBreakdown}
                        dataKey="value"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {flagBreakdown.map((entry) => (
                          <Cell fill={FLAG_COLORS[entry.flag]} key={entry.flag} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} responses`, "Count"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <dl className="mt-stack-md space-y-stack-sm border-t border-outline-variant pt-stack-sm">
                  {flagBreakdown.map((entry) => (
                    <div className="flex items-center justify-between" key={entry.flag}>
                      <dt>
                        <FlagBadge flag={entry.flag} />
                      </dt>
                      <dd className="font-title-sm text-title-sm text-on-surface">
                        {entry.value}{" "}
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          ({data.response_count > 0 ? Math.round((entry.value / data.response_count) * 100) : 0}%)
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>

          <div className="mt-stack-md rounded-xl border border-outline-variant bg-surface-container-low p-stack-sm text-[12px] text-on-surface-variant">
            <p className="font-semibold text-on-surface">Verified Integrity Guarantee:</p>
            <p className="mt-1 text-[11px]">
              Every response is evaluated against timing, repetition, and reworded consistency checks.
            </p>
          </div>
        </Card>
      </div>

      {/* Flagged Responses List */}
      <Card className="p-stack-md">
        <h2 className="mb-stack-md font-title-sm text-title-sm text-on-surface">
          Flagged Responses & Signals ({flagged.length})
        </h2>
        <p className="-mt-stack-sm mb-stack-md font-body-sm text-body-sm text-on-surface-variant">
          Flagged responses are isolated so they do not distort your survey results unless explicitly included.
        </p>

        {flagged.length === 0 ? (
          <EmptyState icon="verified" title="No responses flagged">
            All submitted responses passed quality and consistency verification.
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
