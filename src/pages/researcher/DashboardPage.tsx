import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ResearcherWallet, SurveyRecord } from "@shared/types";
import { Icon, LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";

interface SurveyWithStats extends SurveyRecord {
  response_count?: number;
  targeted_count?: number;
  velocity_per_hr?: number;
  flagged_count?: number;
}

type TabKey = "ongoing" | "wip" | "final_draft" | "completed";

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ongoing");

  const { data: surveysData, isLoading: surveysLoading, error: surveysError } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  const { data: walletData } = useQuery({
    queryKey: ["researcher-wallet"],
    queryFn: () => api<{ wallet: ResearcherWallet }>("/wallet/researcher"),
  });

  if (surveysLoading) return <LoadingBlock label="Loading research operations monitor…" />;
  if (surveysError) return <Notice tone="error">Could not load operations dashboard.</Notice>;

  const surveys = surveysData?.surveys ?? [];
  const wallet = walletData?.wallet;

  const ongoingSurveys = surveys.filter((s) => s.status === "active");
  const wipSurveys = surveys.filter((s) => s.status === "wip" || s.status === "draft");
  const finalDraftSurveys = surveys.filter((s) => s.status === "final_draft");
  const completedSurveys = surveys.filter(
    (s) => (s.status as string) === "completed" || s.status === "closed",
  );

  const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count || 0), 0);
  const availableEtb = wallet?.available_etb ?? 0;

  const currentTabSurveys =
    activeTab === "ongoing"
      ? ongoingSurveys
      : activeTab === "wip"
      ? wipSurveys
      : activeTab === "final_draft"
      ? finalDraftSurveys
      : completedSurveys;

  return (
    <div className="space-y-8 font-body-md text-on-surface pb-16">
      {/* ── Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline-lg font-bold text-[#0D253A] tracking-tight">
            Research Operations Monitor
          </h1>
          <p className="text-base text-on-surface-variant max-w-2xl mt-1">
            Real-time oversight of active studies, respondent acquisition, and operational metrics.
          </p>
        </div>

        <Link to="/researcher/surveys/new">
          <button
            className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            type="button"
          >
            <Icon className="text-[18px]" name="add" />
            <span>New Research</span>
          </button>
        </Link>
      </div>

      {/* ── Metrics Overview (4 Bento Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Studies */}
        <div className="bg-white rounded-xl border border-outline-variant/40 p-6 hover:border-primary transition-all shadow-[0_4px_20px_rgba(0,89,133,0.04)] group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label-md text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
              Active Studies
            </p>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">
              assignment
            </span>
          </div>
          <p className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {ongoingSurveys.length}
          </p>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant text-xs font-medium">
            <span className="material-symbols-outlined text-[14px] text-emerald-600 font-bold">
              trending_up
            </span>
            <span>{ongoingSurveys.length > 0 ? `${ongoingSurveys.length} currently live` : "No active studies"}</span>
          </div>
        </div>

        {/* Card 2: Respondents Reached */}
        <div className="bg-white rounded-xl border border-outline-variant/40 p-6 hover:border-primary transition-all shadow-[0_4px_20px_rgba(0,89,133,0.04)] group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label-md text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
              Respondents Reached
            </p>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1.5 rounded-lg text-lg">
              groups
            </span>
          </div>
          <p className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {totalResponses.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant text-xs font-medium">
            <span className="material-symbols-outlined text-[14px] text-emerald-600 font-bold">
              trending_up
            </span>
            <span>{totalResponses > 0 ? `+${totalResponses} collected` : "0 in last 24h"}</span>
          </div>
        </div>

        {/* Card 3: Wallet Balance */}
        <div className="bg-white rounded-xl border border-outline-variant/40 p-6 hover:border-primary transition-all shadow-[0_4px_20px_rgba(0,89,133,0.04)] group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label-md text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
              Wallet Balance
            </p>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">
              account_balance_wallet
            </span>
          </div>
          <p className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {availableEtb.toLocaleString()}{" "}
            <span className="text-sm font-normal text-on-surface-variant">ETB</span>
          </p>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>Automated escrow holds enabled</span>
          </div>
        </div>

        {/* Card 4: Active Drafts */}
        <div className="bg-white rounded-xl border border-outline-variant/40 p-6 hover:border-primary transition-all shadow-[0_4px_20px_rgba(0,89,133,0.04)] group">
          <div className="flex justify-between items-start mb-4">
            <p className="font-label-md text-xs font-semibold text-[#5A6E7F] uppercase tracking-wider">
              Active Drafts
            </p>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1.5 rounded-lg text-lg">
              draft
            </span>
          </div>
          <p className="text-3xl font-headline-lg font-bold text-[#0D253A]">
            {wipSurveys.length + finalDraftSurveys.length}
          </p>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant text-xs">
            <span>
              {wipSurveys.length + finalDraftSurveys.length > 0
                ? `${wipSurveys.length} in progress, ${finalDraftSurveys.length} final drafts`
                : "No drafts in progress"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Studies Workspace ── */}
      <div className="bg-white rounded-xl border border-outline-variant/40 overflow-hidden shadow-[0_4px_20px_rgba(0,89,133,0.04)]">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant/40 px-6 pt-4 gap-6 bg-[#f8f9ff]">
          <button
            className={`text-xs font-bold pb-3 px-2 transition-colors cursor-pointer ${
              activeTab === "ongoing"
                ? "text-primary border-b-2 border-primary"
                : "text-[#5A6E7F] hover:text-on-surface"
            }`}
            onClick={() => setActiveTab("ongoing")}
            type="button"
          >
            Ongoing Studies ({ongoingSurveys.length})
          </button>
          <button
            className={`text-xs font-bold pb-3 px-2 transition-colors cursor-pointer ${
              activeTab === "wip"
                ? "text-primary border-b-2 border-primary"
                : "text-[#5A6E7F] hover:text-on-surface"
            }`}
            onClick={() => setActiveTab("wip")}
            type="button"
          >
            Work-in-Progress ({wipSurveys.length})
          </button>
          <button
            className={`text-xs font-bold pb-3 px-2 transition-colors cursor-pointer ${
              activeTab === "final_draft"
                ? "text-primary border-b-2 border-primary"
                : "text-[#5A6E7F] hover:text-on-surface"
            }`}
            onClick={() => setActiveTab("final_draft")}
            type="button"
          >
            Final Drafts ({finalDraftSurveys.length})
          </button>
          <button
            className={`text-xs font-bold pb-3 px-2 transition-colors cursor-pointer ${
              activeTab === "completed"
                ? "text-primary border-b-2 border-primary"
                : "text-[#5A6E7F] hover:text-on-surface"
            }`}
            onClick={() => setActiveTab("completed")}
            type="button"
          >
            Completed ({completedSurveys.length})
          </button>
        </div>

        {/* Study Rows or Empty State */}
        {currentTabSurveys.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-3 border border-outline-variant/40">
              <span className="material-symbols-outlined text-[24px]">assignment</span>
            </div>
            <h3 className="text-base font-headline-md font-bold text-[#0D253A] mb-1">
              No studies in this view
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mb-5">
              {activeTab === "ongoing"
                ? "Create a new study or check ongoing operations."
                : activeTab === "wip"
                ? "No work-in-progress drafts currently being edited."
                : activeTab === "final_draft"
                ? "No final drafts ready for posting."
                : "Completed research studies will appear here."}
            </p>
            {activeTab !== "completed" && (
              <Link to="/researcher/surveys/new">
                <button
                  className="bg-[#002446] hover:bg-[#00386c] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 mx-auto"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Create New Study</span>
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {currentTabSurveys.map((survey) => {
              const target = survey.targeted_count || 100;
              const completed = survey.response_count || 0;
              const percent = Math.min(100, Math.round((completed / target) * 100));

              return (
                <div
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 hover:bg-[#f8f9ff] transition-colors"
                  key={survey.id}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-headline-md font-bold text-[#0D253A] truncate">
                        {survey.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          survey.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {survey.status === "active" ? "Live" : survey.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-on-surface-variant text-xs">
                      <div className="flex items-center gap-1">
                        <Icon className="text-[16px] text-primary" name="groups" />
                        <span>
                          {completed}/{target} Respondents
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon className="text-[16px] text-primary" name="speed" />
                        <span>+{survey.velocity_per_hr ?? 0}/hr velocity</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          (survey.flagged_count ?? 0) > 0 ? "text-error" : "text-on-surface-variant"
                        }`}
                      >
                        <Icon className="text-[16px]" name="flag" />
                        <span>
                          {(survey.flagged_count ?? 0) > 0
                            ? `${survey.flagged_count} flagged for review`
                            : "0 flagged"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full lg:w-48 flex flex-col gap-1.5 shrink-0">
                    <div className="flex justify-between text-[11px] font-semibold text-[#5A6E7F]">
                      <span>Progress</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:ml-4 shrink-0">
                    {survey.status === "final_draft" ? (
                      <Link
                        to={`/survey-posting/${survey.id}`}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Proceed to Posting"
                      >
                        <span>Launch</span>
                        <Icon className="text-[16px]" name="arrow_forward" />
                      </Link>
                    ) : null}
                    <Link
                      aria-label="View Analytics"
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                      title="View Analytics"
                      to={`/researcher/surveys/${survey.id}/dashboard`}
                    >
                      <Icon className="text-[20px]" name="analytics" />
                    </Link>
                    <Link
                      aria-label="Edit Survey"
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit Survey"
                      to={
                        survey.builder_type === "import"
                          ? `/survey-builder/import/${survey.id}`
                          : survey.builder_type === "ai"
                          ? `/survey-builder/manual/${survey.id}?source=ai`
                          : `/survey-builder/manual/${survey.id}`
                      }
                    >
                      <Icon className="text-[20px]" name="edit" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
