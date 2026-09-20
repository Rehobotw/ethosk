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
import { useLanguage } from "@/lib/language";

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

const STATUS_LABELS_AM: Record<SurveyStatus, string> = {
  wip: "በመስራት ላይ ያለ",
  draft: "ረቂቅ",
  final_draft: "የመጨረሻ ረቂቅ",
  pending_review: "በግምገማ ላይ",
  active: "ንቁ",
  rejected: "ውድቅ የተደረገ",
  closed: "የተዘጋ",
};

export function SurveyListPage() {
  const { language, t } = useLanguage();
  const isAm = language === "am";
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
            {isAm ? t("researcher.my_surveys") : "My Surveys"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {isAm
              ? t("researcher.manage_studies_sub")
              : "Manage your studies, track respondent intake, and review real-time research insights."}
          </p>
        </div>
        <Link to="/researcher/surveys/new">
          <Button icon="add" className="primary-gradient-btn px-5 py-2.5 rounded-xl font-semibold shadow-sm">
            {isAm ? t("researcher.create_new") : "Create New Survey"}
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
          {(
            [
              { key: "all", label: isAm ? t("researcher.all_surveys") : "All Surveys" },
              { key: "active", label: isAm ? "ንቁ" : "Active" },
              { key: "draft", label: isAm ? t("researcher.drafts") : "Drafts" },
              { key: "closed", label: isAm ? t("researcher.closed") : "Closed" },
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
            placeholder={isAm ? t("researcher.search_surveys_placeholder") : "Search surveys by title..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? <LoadingBlock label={isAm ? "ጥናቶችዎን በመጫን ላይ…" : "Loading your surveys…"} /> : null}
      {error ? <Notice tone="error">{isAm ? "ጥናቶችን መጫን አልተቻለም።" : "Could not load your surveys."}</Notice> : null}

      {/* Empty State */}
      {!isLoading && !error && filteredSurveys.length === 0 ? (
        <EmptyState
          icon="description"
          title={
            searchQuery
              ? isAm
                ? "ተዛማጅ ጥናቶች አልተገኙም"
                : "No matching surveys"
              : isAm
              ? "ምንም ጥናቶች አልተገኙም"
              : "No surveys found"
          }
          action={
            <Link to="/researcher/surveys/new">
              <Button icon="add" className="primary-gradient-btn px-5 py-2.5 rounded-xl font-semibold shadow-sm">
                {isAm ? "የመጀመሪያ ጥናትዎን ይፍጠሩ" : "Create Your First Survey"}
              </Button>
            </Link>
          }
        >
          {searchQuery
            ? isAm
              ? "የፍለጋ ቃላትን ወይም ማጣሪያዎችን ለማስተካከል ይሞክሩ።"
              : "Try adjusting your search terms or filter criteria."
            : isAm
            ? "እስካሁን በዚህ ምድብ ውስጥ ምንም ጥናት አልፈጠሩም። አሁን አዲስ ጥናት ማዘጋጀት ይጀምሩ።"
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
                      {isAm ? STATUS_LABELS_AM[survey.status] : STATUS_LABELS[survey.status]}
                    </span>
                    <span className="text-[12px] text-slate-400 font-medium">
                      {isAm
                        ? `የተፈጠረው፡ ${new Date(survey.created_at).toLocaleDateString()}`
                        : `Created on ${new Date(survey.created_at).toLocaleDateString()}`}
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
                      {survey.questions.length} {isAm ? "ጥያቄዎች" : survey.questions.length === 1 ? "question" : "questions"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon className="text-[15px] text-slate-400" name="group" />
                      {survey.response_count} {isAm ? "ምላሾች" : survey.response_count === 1 ? "response" : "responses"}
                    </span>
                    {survey.reward_etb ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                        <Icon className="text-[14px] text-emerald-600" name="payments" />
                        {survey.reward_etb} ETB {isAm ? "/ በምላሽ" : "/ response"}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isPostable ? (
                    <Link to={`/survey-posting/${survey.id}`}>
                      <Button icon="send" className="primary-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs">
                        {isAm ? t("researcher.post_to_audience") : "Post to Audience"}
                      </Button>
                    </Link>
                  ) : null}

                  {isEditable ? (
                    <Link to={`/researcher/surveys/${survey.id}/edit`}>
                      <Button icon="edit" variant="outline" className="px-4 py-2 rounded-xl text-xs font-semibold">
                        {survey.status === "wip"
                          ? isAm
                            ? t("researcher.resume_editing")
                            : "Resume Editing"
                          : isAm
                          ? t("researcher.edit_survey")
                          : "Edit Survey"}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to={`/researcher/surveys/${survey.id}/dashboard`}>
                        <Button icon="insights" className="primary-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs">
                          {isAm ? t("researcher.analytics") : "Analytics"}
                        </Button>
                      </Link>
                      <Link to={`/researcher/surveys/${survey.id}/edit`}>
                        <Button
                          icon="visibility"
                          variant="outline"
                          className="px-4 py-2 rounded-xl text-xs font-semibold"
                          title="View-only: active and submitted surveys cannot be edited"
                        >
                          {isAm ? t("researcher.view_survey") : "View (Read-Only)"}
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
          {isAm
            ? "የምላሽ ጥራትን እና ታማኝነትን ለመጠበቅ ንቁ ጥናቶች የተጠበቁ ናቸው። መረጃ በሚሰበሰብበት ጊዜ የጥያቄ ለውጦች የተገደቡ ናቸው።"
            : "Active surveys are protected to preserve response integrity. Question edits are restricted while data collection is underway."}
        </p>
      </div>
    </div>
  );
}
