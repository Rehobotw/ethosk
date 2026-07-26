import { Link } from "react-router-dom";
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
import type { ResearcherWallet, SurveyRecord } from "@shared/types";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  LoadingBlock,
  Notice,
  SectionHeading,
  StatBlock,
} from "@/components/ui";
import { api } from "@/lib/api";

interface SurveyWithStats extends SurveyRecord {
  response_count: number;
  targeted_count: number;
}

interface AnalyticsPayload {
  response_count: number;
  targeted_count: number;
  completion_rate: number;
  flagged_count: number;
  clean_count: number;
  distributions: Record<string, Record<string, number>>;
  questions: Array<{ id: string; text: string; options?: string[] }>;
}

export function DashboardPage() {
  const { data: surveysData, isLoading: surveysLoading, error: surveysError } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  const { data: walletData } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  const activeSurveys = surveysData?.surveys.filter((s) => s.status === "active") ?? [];
  const draftSurveys = surveysData?.surveys.filter((s) => s.status === "draft") ?? [];
  const firstActiveSurvey = activeSurveys[0];

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics", firstActiveSurvey?.id],
    queryFn: () => api<AnalyticsPayload>(`/surveys/${firstActiveSurvey!.id}/analytics`),
    enabled: Boolean(firstActiveSurvey?.id),
  });

  if (surveysLoading) return <LoadingBlock label="Loading researcher dashboard & analytics…" />;
  if (surveysError) return <Notice tone="error">Could not load dashboard data.</Notice>;

  const totalResponses = surveysData?.surveys.reduce((sum, s) => sum + (s.response_count || 0), 0) ?? 0;
  const totalTargeted = surveysData?.surveys.reduce((sum, s) => sum + (s.targeted_count || 0), 0) ?? 0;
  const wallet = walletData?.wallet;

  // Prepare chart data for active survey distributions
  const primaryQuestion = analyticsData?.questions?.find((q) => q.options && q.options.length > 0);
  const chartDist = primaryQuestion ? analyticsData?.distributions[primaryQuestion.id] : undefined;
  const barChartData = chartDist
    ? Object.entries(chartDist).map(([option, count]) => ({ option, count }))
    : [];

  const qualityPieData = analyticsData
    ? [
        { name: "Clean", value: analyticsData.clean_count, color: "#10b981" },
        { name: "Flagged", value: analyticsData.flagged_count, color: "#ef4444" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-stack-lg">
      <SectionHeading
        actions={
          <div className="flex gap-stack-sm">
            <Link to="/researcher/wallet">
              <Button icon="account_balance_wallet" variant="outline">
                {wallet ? `${wallet.available_etb.toLocaleString()} ETB` : "Wallet"}
              </Button>
            </Link>
            <Link to="/researcher/surveys/new">
              <Button icon="add">Create Survey</Button>
            </Link>
          </div>
        }
        subtitle="Real-time analytics, response quality verification, and active studies."
        title="Researcher Overview & Analytics"
      />

      {/* Top Metric Cards */}
      <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label="Total Responses"
          value={totalResponses > 0 ? totalResponses.toLocaleString() : "0"}
        />
        <StatBlock
          label="Targeted Audience"
          value={totalTargeted > 0 ? totalTargeted.toLocaleString() : "0"}
        />
        <StatBlock
          label="Available Balance"
          value={wallet ? `${wallet.available_etb.toLocaleString()} ETB` : "—"}
        />
        <StatBlock
          label="Quality Pass Rate"
          tone={analyticsData && analyticsData.flagged_count > 0 ? "danger" : "default"}
          value={
            analyticsData && analyticsData.response_count > 0
              ? `${Math.round((analyticsData.clean_count / analyticsData.response_count) * 100)}%`
              : "100%"
          }
        />
      </div>

      {/* Analytics Visual Graphs Section */}
      {firstActiveSurvey && analyticsData ? (
        <div className="grid gap-stack-md lg:grid-cols-3">
          {/* Main Distribution Bar Chart */}
          <Card className="p-stack-md lg:col-span-2">
            <div className="mb-stack-md flex flex-wrap items-center justify-between gap-stack-sm border-b border-outline-variant pb-stack-sm">
              <div>
                <span className="font-label-caps text-[11px] uppercase text-primary font-semibold">
                  Live Active Study Analytics
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">
                  {firstActiveSurvey.title}
                </h2>
              </div>
              <Link to={`/researcher/surveys/${firstActiveSurvey.id}/dashboard`}>
                <Button icon="insights" variant="ghost">
                  Full Analytics
                </Button>
              </Link>
            </div>

            {primaryQuestion && barChartData.length > 0 ? (
              <div>
                <p className="mb-stack-sm font-body-sm text-body-sm font-semibold text-on-surface">
                  {primaryQuestion.text}
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="option"
                        stroke="#475569"
                        style={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis allowDecimals={false} stroke="#475569" style={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyState icon="bar_chart" title="Collecting response distribution data..." />
            )}
          </Card>

          {/* Quality & Fraud Pie Chart */}
          <Card className="p-stack-md flex flex-col justify-between">
            <div>
              <div className="mb-stack-sm border-b border-outline-variant pb-stack-sm">
                <span className="font-label-caps text-[11px] uppercase text-primary font-semibold">
                  Fraud & Quality Filter
                </span>
                <h2 className="font-title-sm text-title-sm text-on-surface">
                  Response Integrity
                </h2>
              </div>

              {qualityPieData.length > 0 ? (
                <div className="h-52 w-full">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={qualityPieData}
                        dataKey="value"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {qualityPieData.map((entry) => (
                          <Cell fill={entry.color} key={entry.name} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon="verified" title="100% Clean Responses" />
              )}
            </div>

            <div className="mt-stack-sm rounded-xl border border-outline-variant bg-surface-container-low p-3 text-[12px] text-on-surface-variant">
              <p className="font-semibold text-on-surface">Deterministic Quality Checks:</p>
              <ul className="mt-1 space-y-0.5 text-[11px]">
                <li>✓ Speed-run timing verification</li>
                <li>✓ Straight-line answer detection</li>
                <li>✓ Reworded question consistency</li>
              </ul>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Active Surveys Section */}
      <section>
        <div className="mb-stack-md flex items-center justify-between">
          <h2 className="flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
            <Icon className="text-secondary" name="bolt" /> Active Surveys ({activeSurveys.length})
          </h2>
          <Link className="font-body-sm text-body-sm text-primary hover:underline" to="/researcher/surveys">
            View All
          </Link>
        </div>

        {activeSurveys.length > 0 ? (
          <div className="space-y-stack-md">
            {activeSurveys.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </div>
        ) : (
          <Card className="p-stack-md text-center">
            <p className="font-body-sm text-on-surface-variant">No active surveys running right now.</p>
          </Card>
        )}
      </section>

      {/* Draft Surveys Section */}
      {draftSurveys.length > 0 ? (
        <section>
          <h2 className="mb-stack-md flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
            <Icon className="text-on-surface-variant" name="edit_note" /> Draft Surveys ({draftSurveys.length})
          </h2>
          <div className="space-y-stack-md">
            {draftSurveys.map((survey) => (
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
      <div className="grid gap-stack-md p-stack-md md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isDraft ? "bg-on-surface-variant" : "bg-status-passed"
              }`}
            />
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              {isDraft
                ? "Draft"
                : `Sent ${survey.sent_at ? new Date(survey.sent_at).toLocaleDateString() : ""}`}
            </p>
          </div>
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
                Completion Rate
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
                  View Data & Graphs
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
