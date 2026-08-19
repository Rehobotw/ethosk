import { useState } from "react";
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
} from "@/components/ui";
import { api } from "@/lib/api";

interface SurveyWithStats extends SurveyRecord {
  response_count: number;
  targeted_count: number;
}

const STATUS_STYLES: Record<SurveyStatus, string> = {
  wip: "bg-amber-50 text-amber-700 border border-amber-200/60",
  draft: "bg-slate-100 text-slate-700 border border-slate-200/60",
  final_draft: "bg-sky-50 text-sky-700 border border-sky-200/60",
  pending_review: "bg-amber-50 text-amber-700 border border-amber-200/60",
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200/60",
  closed: "bg-slate-100 text-slate-600 border border-slate-200/60",
};

const STATUS_LABELS: Record<SurveyStatus, string> = {
  wip: "Work in Progress",
  draft: "Draft",
  final_draft: "Final Draft",
  pending_review: "Pending Review",
  active: "Active",
  rejected: "Rejected",
  closed: "Closed",
};

export function SurveyListPage() {
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  const surveys = data?.surveys ?? [];

  const filteredSurveys = surveys.filter((s) => {
    if (filter === "active" && s.status !== "active" && s.status !== "pending_review") return false;
    if (filter === "draft" && !["draft", "wip", "final_draft"].includes(s.status)) return false;
    if (filter === "closed" && s.status !== "closed" && s.status !== "rejected") return false;
    if (searchQuery.trim()) {
      return (
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight font-headline-md">
            My Surveys
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Manage your studies, track respondent intake, and review real-time research insights.
          </p>
        </div>
        <Link to="/researcher/surveys/new">
          <Button icon="add" className="primary-gradient-btn px-5 py-2.5 rounded-xl font-semibold shadow-sm">
            Create New Survey
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
          {(
            [
              { key: "all", label: "All Surveys" },
              { key: "active", label: "Active" },
              { key: "draft", label: "Drafts" },
              { key: "closed", label: "Closed" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-slate-500 hover:text-primary"
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400" name="search" />
          <input
            type="text"
            placeholder="Search surveys by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? <LoadingBlock label="Loading your surveys…" /> : null}
      {error ? <Notice tone="error">Could not load your surveys.</Notice> : null}

      {/* Empty State */}
      {!isLoading && !error && filteredSurveys.length === 0 ? (
        <EmptyState
          icon="description"
          title={searchQuery ? "No matching surveys" : "No surveys found"}
          action={
            <Link to="/researcher/surveys/new">
              <Button icon="add" className="primary-gradient-btn px-5 py-2.5 rounded-xl font-semibold shadow-sm">
                Create Your First Survey
              </Button>
            </Link>
          }
        >
          {searchQuery
            ? "Try adjusting your search terms or filter criteria."
            : "You haven't created any surveys in this category yet. Start drafting a new survey now."}
        </EmptyState>
      ) : null}

      {/* Survey Cards */}
      <div className="space-y-4">
        {filteredSurveys.map((survey) => {
          const isEditable = ["wip", "draft", "final_draft", "rejected"].includes(survey.status);
          const isPostable = survey.status === "final_draft" || survey.status === "draft";

          return (
            <Card
              className="p-5 border border-slate-200/80 bg-white/80 backdrop-blur-sm rounded-2xl hover:shadow-md transition-all group"
              key={survey.id}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        STATUS_STYLES[survey.status]
                      }`}
                    >
                      {STATUS_LABELS[survey.status]}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium">
                      Created on {new Date(survey.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-primary group-hover:text-[#196490] transition-colors truncate font-headline-md">
                    {survey.title}
                  </h3>

                  {survey.description ? (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">{survey.description}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Icon className="text-[15px] text-slate-400" name="quiz" />
                      {survey.questions.length} question{survey.questions.length === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon className="text-[15px] text-slate-400" name="group" />
                      {survey.response_count} response{survey.response_count === 1 ? "" : "s"}
                    </span>
                    {survey.reward_etb ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                        <Icon className="text-[14px] text-emerald-600" name="payments" />
                        {survey.reward_etb} ETB / response
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isPostable ? (
                    <Link to={`/survey-posting/${survey.id}`}>
                      <Button icon="send" className="primary-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs">
                        Post to Audience
                      </Button>
                    </Link>
                  ) : null}

                  {isEditable ? (
                    <Link to={`/researcher/surveys/${survey.id}/edit`}>
                      <Button icon="edit" variant="outline" className="px-4 py-2 rounded-xl text-xs font-semibold">
                        {survey.status === "wip" ? "Resume Editing" : "Edit Survey"}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to={`/researcher/surveys/${survey.id}/dashboard`}>
                        <Button icon="insights" className="primary-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs">
                          Analytics
                        </Button>
                      </Link>
                      <Link to={`/researcher/surveys/${survey.id}/edit`}>
                        <Button icon="visibility" variant="outline" className="px-4 py-2 rounded-xl text-xs font-semibold">
                          View
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-500 text-xs">
        <Icon className="text-[16px] text-slate-400 shrink-0" name="lock" />
        <p>
          Active surveys are protected to preserve response integrity. Question edits are restricted while data collection is underway.
        </p>
      </div>
    </div>
  );
}
