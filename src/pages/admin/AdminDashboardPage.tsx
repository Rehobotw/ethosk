import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button, Card, Icon, LoadingBlock, Notice, SectionHeading } from "@/components/ui";

interface AdminMetrics {
  users: {
    total: number;
    respondents: number;
    researchers: number;
    admins: number;
    tierBreakdown: {
      registered_tier0: number;
      id_verified_tier1: number;
      attribute_verified_tier2: number;
      institution_attested_tier3: number;
    };
  };
  surveys: {
    total: number;
    draft: number;
    pendingReview: number;
    needsCorrection: number;
    active: number;
    closed: number;
    rejected: number;
  };
  responses: {
    total: number;
    clean: number;
    flagged: number;
  };
  financials: {
    totalEscrowEtb: number;
  };
  queues: {
    pendingDocuments: number;
    pendingResearchers: number;
    pendingSurveys: number;
    totalPendingApproval: number;
  };
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery<AdminMetrics>({
    queryKey: ["admin", "metrics"],
    queryFn: () => api<AdminMetrics>("/admin/metrics"),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <LoadingBlock label="Loading administrative platform metrics…" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-stack-md">
        <SectionHeading subtitle="Administrative Overview & Metrics" title="Admin Dashboard" />
        <Notice tone="error">Could not load platform metrics. Please try again later.</Notice>
      </div>
    );
  }

  const { users, surveys, responses, financials, queues } = data;
  const fraudRate =
    responses.total > 0 ? ((responses.flagged / responses.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-stack-lg">
      <SectionHeading
        actions={
          <div className="flex gap-2">
            <Link to="/admin/review-queue">
              <Button icon="rule" variant="outline">
                Review Queue ({queues.pendingDocuments})
              </Button>
            </Link>
            <Link to="/admin/researcher-approvals">
              <Button icon="how_to_reg" variant="outline">
                Researcher Queue ({queues.pendingResearchers})
              </Button>
            </Link>
          </div>
        }
        subtitle="Platform-wide operational metrics, approval queues, and user tier distribution."
        title="Admin Overview Dashboard"
      />

      {/* Action Banner for pending approvals */}
      {queues.totalPendingApproval > 0 ? (
        <div className="rounded-xl border border-secondary/30 bg-secondary-container/20 p-stack-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-on-secondary">
                <Icon name="pending_actions" />
              </div>
              <div>
                <h3 className="font-title-sm text-title-sm text-on-surface">
                  {queues.totalPendingApproval} Items Awaiting Review
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {queues.pendingSurveys} surveys, {queues.pendingResearchers} researchers, and{" "}
                  {queues.pendingDocuments} documents require administrative action.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {queues.pendingSurveys > 0 ? (
                <Link to="/admin/survey-approvals">
                  <Button icon="assignment_turned_in" variant="secondary">
                    Review Surveys ({queues.pendingSurveys})
                  </Button>
                </Link>
              ) : null}
              {queues.pendingResearchers > 0 ? (
                <Link to="/admin/researcher-approvals">
                  <Button icon="how_to_reg" variant="secondary">
                    Review Researchers ({queues.pendingResearchers})
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Top Level Metric Cards */}
      <div className="grid gap-stack-md sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-stack-md">
          <div className="flex items-center justify-between">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Total Users
            </p>
            <Icon className="text-primary" name="group" />
          </div>
          <p className="mt-stack-sm font-headline-md text-headline-md font-bold text-on-surface">
            {users.total.toLocaleString()}
          </p>
          <div className="mt-stack-xs flex gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <span>{users.respondents} Respondents</span>
            <span>·</span>
            <span>{users.researchers} Researchers</span>
          </div>
        </Card>

        <Card className="p-stack-md">
          <div className="flex items-center justify-between">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Live Surveys
            </p>
            <Icon className="text-flag-clean" name="sensors" />
          </div>
          <p className="mt-stack-sm font-headline-md text-headline-md font-bold text-on-surface">
            {surveys.active.toLocaleString()}
          </p>
          <p className="mt-stack-xs font-body-sm text-body-sm text-on-surface-variant">
            {surveys.total} total instruments created
          </p>
        </Card>

        <Card className="p-stack-md">
          <div className="flex items-center justify-between">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Total Responses
            </p>
            <Icon className="text-secondary" name="query_stats" />
          </div>
          <p className="mt-stack-sm font-headline-md text-headline-md font-bold text-on-surface">
            {responses.total.toLocaleString()}
          </p>
          <p className="mt-stack-xs font-body-sm text-body-sm text-on-surface-variant">
            {responses.clean} verified clean ({fraudRate}% flagged)
          </p>
        </Card>

        <Card className="p-stack-md">
          <div className="flex items-center justify-between">
            <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Escrow Volume
            </p>
            <Icon className="text-primary" name="account_balance_wallet" />
          </div>
          <p className="mt-stack-sm font-headline-md text-headline-md font-bold text-primary">
            {financials.totalEscrowEtb.toLocaleString()} ETB
          </p>
          <p className="mt-stack-xs font-body-sm text-body-sm text-on-surface-variant">
            Committed to active & pending studies
          </p>
        </Card>
      </div>

      {/* Grid: Respondent Tiers & Survey Pipeline */}
      <div className="grid gap-stack-lg lg:grid-cols-2">
        {/* Respondent Tier Distribution */}
        <Card className="p-stack-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-stack-md">
            <div>
              <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
                Respondent Verification Tiers
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Breakdown of identity & attribute verification levels
              </p>
            </div>
            <Icon className="text-primary" name="verified_user" />
          </div>

          <div className="mt-stack-md space-y-stack-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-surface-variant" />
                <span className="font-body-sm text-body-sm text-on-surface">
                  Tier 0 (Registered / Email only)
                </span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-on-surface">
                {users.tierBreakdown.registered_tier0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-secondary" />
                <span className="font-body-sm text-body-sm text-on-surface">
                  Tier 1 (Fayda / National ID Verified)
                </span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-secondary">
                {users.tierBreakdown.id_verified_tier1}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="font-body-sm text-body-sm text-on-surface">
                  Tier 2 (Attribute / Student &amp; Employee ID)
                </span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-primary">
                {users.tierBreakdown.attribute_verified_tier2}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-flag-clean" />
                <span className="font-body-sm text-body-sm text-on-surface">
                  Tier 3 (Institutional Attestation)
                </span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-flag-clean">
                {users.tierBreakdown.institution_attested_tier3}
              </span>
            </div>
          </div>
        </Card>

        {/* Survey Pipeline Breakdown */}
        <Card className="p-stack-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-stack-md">
            <div>
              <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
                Survey Moderation Pipeline
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Current status across all research instruments
              </p>
            </div>
            <Icon className="text-primary" name="view_kanban" />
          </div>

          <div className="mt-stack-md space-y-stack-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-flag-clean" />
                <span className="font-body-sm text-body-sm text-on-surface">Active (Live in Field)</span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-flag-clean">
                {surveys.active}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-secondary" />
                <span className="font-body-sm text-body-sm text-on-surface">
                  Pending Admin Review
                </span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-secondary">
                {surveys.pendingReview}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-error" />
                <span className="font-body-sm text-body-sm text-on-surface">
                  Needs Revision / Correction
                </span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-error">
                {surveys.needsCorrection}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-surface-variant" />
                <span className="font-body-sm text-body-sm text-on-surface">Drafts &amp; Final Drafts</span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-on-surface-variant">
                {surveys.draft}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-outline" />
                <span className="font-body-sm text-body-sm text-on-surface">Closed / Completed</span>
              </div>
              <span className="font-label-caps text-title-sm font-bold text-on-surface">
                {surveys.closed}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
