import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { canResearcherExport } from "@shared/permissions";
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
import { api, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { ExportGateModal } from "@/components/researcher/ExportGateModal";

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
  const { t } = useLanguage();
  const { data: surveysData, isLoading: surveysLoading, error: surveysError } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  const { data: walletData } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  const activeSurveys = surveysData?.surveys.filter((s) => s.status === "active") ?? [];
  const finalDraftSurveys = surveysData?.surveys.filter((s) => s.status === "final_draft") ?? [];
  const wipDraftSurveys = surveysData?.surveys.filter((s) => s.status === "draft") ?? [];
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

  const { user } = useAuth();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingSurveyId, setExportingSurveyId] = useState<string | null>(null);

  const verificationLevel = user?.researcher_verification_level ?? "unverified";
  const subscriptionTier = user?.subscription_tier ?? "free";
  const isExportAllowed = canResearcherExport(verificationLevel, subscriptionTier);

  const completedSurveys = surveysData?.surveys.filter((s) => s.status === "closed") ?? [];

  const handleExportClick = async (surveyId: string) => {
    if (!isExportAllowed) {
      setExportModalOpen(true);
      return;
    }

    try {
      setExportingSurveyId(surveyId);
      const token = getToken();
      const res = await fetch(`/api/surveys/${surveyId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        setExportModalOpen(true);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey_${surveyId}_raw_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setExportModalOpen(true);
    } finally {
      setExportingSurveyId(null);
    }
  };

  return (
    <div className="space-y-stack-lg">
      <SectionHeading
        actions={
          <div className="flex gap-stack-sm">
            <Link to="/researcher/wallet">
              <Button icon="account_balance_wallet" variant="outline">
                {wallet ? `${wallet.available_etb.toLocaleString()} ETB` : t("nav.wallet")}
              </Button>
            </Link>
            <Link to="/researcher/surveys/new">
              <Button icon="add">{t("researcher.create_new")}</Button>
            </Link>
          </div>
        }
        subtitle="Real-time analytics, response quality verification, and active studies."
        title={t("researcher.dashboard_title")}
      />

      {/* Dual Soft Gate Status Banner (REH-21) */}
      <Card className="p-stack-md bg-surface-container-low border-outline-variant">
        <div className="flex flex-wrap items-center justify-between gap-stack-md">
          <div className="space-y-1">
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              Researcher Access & Verification Status
            </h3>
            <p className="font-body-sm text-[12px] text-on-surface-variant">
              Ethiosk enforces two independent access gates: ID Verification (publishing) and Paid Subscription (AI & Raw Data Export).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-stack-md">
            {/* Gate 1: Verification */}
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2">
              <Icon
                className={verificationLevel === "id_verified" ? "text-status-passed" : "text-on-surface-variant"}
                name={verificationLevel === "id_verified" ? "verified" : "shield"}
              />
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">Identity Gate</p>
                <p className="font-title-sm text-xs font-semibold text-on-surface">
                  {verificationLevel === "id_verified" ? "ID Verified" : "Unverified"}
                </p>
              </div>
            </div>

            {/* Gate 2: Subscription */}
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2">
              <Icon
                className={subscriptionTier === "subscribed" ? "text-primary" : "text-on-surface-variant"}
                name={subscriptionTier === "subscribed" ? "workspace_premium" : "card_membership"}
              />
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">Plan Gate</p>
                <p className="font-title-sm text-xs font-semibold text-on-surface">
                  {subscriptionTier === "subscribed" ? "Subscribed Pro" : "Free Plan"}
                </p>
              </div>
            </div>

            {/* Raw Export Capability */}
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2">
              <Icon
                className={isExportAllowed ? "text-status-passed" : "text-error"}
                name={isExportAllowed ? "download_done" : "lock"}
              />
              <div>
                <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">Raw Export</p>
                <p className="font-title-sm text-xs font-semibold text-on-surface">
                  {isExportAllowed ? "Unlocked" : "Gated (Pro + ID)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Metric Cards */}
      <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label={t("researcher.completed_responses")}
          value={totalResponses > 0 ? totalResponses.toLocaleString() : "0"}
        />
        <StatBlock
          label="Targeted Audience"
          value={totalTargeted > 0 ? totalTargeted.toLocaleString() : "0"}
        />
        <StatBlock
          label={t("researcher.wallet_balance")}
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
              <SurveyCard
                exportingId={exportingSurveyId}
                key={survey.id}
                onExportClick={() => handleExportClick(survey.id)}
                survey={survey}
              />
            ))}
          </div>
        ) : (
          <Card className="p-stack-md text-center">
            <p className="font-body-sm text-on-surface-variant">No active surveys running right now.</p>
          </Card>
        )}
      </section>

      {/* Completed Studies Tab / Section (REH-41) */}
      {completedSurveys.length > 0 ? (
        <section>
          <div className="mb-stack-md flex items-center justify-between">
            <h2 className="flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
              <Icon className="text-status-passed" name="task_alt" /> Completed Studies ({completedSurveys.length})
            </h2>
          </div>
          <div className="space-y-stack-md">
            {completedSurveys.map((survey) => (
              <SurveyCard
                exportingId={exportingSurveyId}
                key={survey.id}
                onExportClick={() => handleExportClick(survey.id)}
                survey={survey}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Final Drafts Section */}
      {finalDraftSurveys.length > 0 ? (
        <section>
          <h2 className="mb-stack-md flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
            <Icon className="text-primary" name="verified_user" /> Final Drafts ({finalDraftSurveys.length})
          </h2>
          <p className="mb-stack-sm font-body-sm text-[12px] text-on-surface-variant">
            Validated studies awaiting audience allocation, budget reservation, and launching.
          </p>
          <div className="space-y-stack-md">
            {finalDraftSurveys.map((survey) => (
              <SurveyCard
                exportingId={exportingSurveyId}
                key={survey.id}
                onExportClick={() => handleExportClick(survey.id)}
                survey={survey}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Work-in-Progress Draft Surveys Section */}
      {wipDraftSurveys.length > 0 ? (
        <section>
          <h2 className="mb-stack-md flex items-center gap-stack-sm font-title-sm text-title-sm text-on-surface">
            <Icon className="text-on-surface-variant" name="edit_note" /> Work-in-Progress Drafts ({wipDraftSurveys.length})
          </h2>
          <div className="space-y-stack-md">
            {wipDraftSurveys.map((survey) => (
              <SurveyCard
                exportingId={exportingSurveyId}
                key={survey.id}
                onExportClick={() => handleExportClick(survey.id)}
                survey={survey}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Upgrade & Verification Gate Modal */}
      <ExportGateModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        verificationLevel={verificationLevel}
        subscriptionTier={subscriptionTier}
      />
    </div>
  );
}

function SurveyCard({
  survey,
  onExportClick,
  exportingId,
}: {
  survey: SurveyWithStats;
  onExportClick?: () => void;
  exportingId?: string | null;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isWip = survey.status === "draft";
  const isFinalDraft = survey.status === "final_draft";
  const isClosed = survey.status === "closed";
  const isExporting = exportingId === survey.id;

  const deleteMutation = useMutation({
    mutationFn: () => api(`/surveys/${survey.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => api<SurveyRecord>(`/surveys/${survey.id}/duplicate`, { method: "POST" }),
    onSuccess: async (newSurvey) => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate(`/researcher/surveys/${newSurvey.id}/edit`);
    },
  });

  const completion =
    survey.targeted_count > 0
      ? Math.round((survey.response_count / survey.targeted_count) * 100)
      : 0;

  const statusLabel = isWip
    ? "Draft (WIP)"
    : isFinalDraft
    ? "Final Draft"
    : isClosed
    ? "Completed Study"
    : `Sent ${survey.sent_at ? new Date(survey.sent_at).toLocaleDateString() : ""}`;

  const dotColor = isWip
    ? "bg-on-surface-variant"
    : isFinalDraft
    ? "bg-primary"
    : isClosed
    ? "bg-status-passed"
    : "bg-status-passed";

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-stack-md p-stack-md md:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              {statusLabel}
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
          {isFinalDraft ? (
            <>
              <Link to={`/researcher/surveys/${survey.id}/edit`}>
                <Button className="w-full" icon="rocket_launch">
                  Launch / Post
                </Button>
              </Link>
              <div className="flex gap-2">
                <Link className="flex-1" to={`/researcher/surveys/${survey.id}/edit`}>
                  <Button className="w-full text-xs" icon="edit" variant="outline">
                    Edit
                  </Button>
                </Link>
                <Button
                  className="flex-1 text-xs"
                  icon="content_copy"
                  loading={duplicateMutation.isPending}
                  onClick={() => duplicateMutation.mutate()}
                  variant="outline"
                >
                  Duplicate
                </Button>
                <Button
                  className="text-xs"
                  icon="delete"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${survey.title}"?`)) {
                      deleteMutation.mutate();
                    }
                  }}
                  variant="outline"
                >
                  Delete
                </Button>
              </div>
            </>
          ) : isWip ? (
            <>
              <Link to={`/researcher/surveys/${survey.id}/edit`}>
                <Button className="w-full" icon="edit">
                  Continue Editing
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-xs"
                  icon="content_copy"
                  loading={duplicateMutation.isPending}
                  onClick={() => duplicateMutation.mutate()}
                  variant="outline"
                >
                  Duplicate
                </Button>
                <Button
                  className="text-xs"
                  icon="delete"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${survey.title}"?`)) {
                      deleteMutation.mutate();
                    }
                  }}
                  variant="outline"
                >
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to={`/researcher/surveys/${survey.id}/dashboard`}>
                <Button className="w-full" icon="insights">
                  View Data & Graphs
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-xs"
                  icon="download"
                  loading={isExporting}
                  onClick={onExportClick}
                  variant="outline"
                >
                  Export Raw CSV
                </Button>
                <Button
                  className="text-xs"
                  icon="content_copy"
                  loading={duplicateMutation.isPending}
                  onClick={() => duplicateMutation.mutate()}
                  variant="outline"
                >
                  Duplicate
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
