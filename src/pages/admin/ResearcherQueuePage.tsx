import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingBlock,
  Notice,
  SectionHeading,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { ResearcherVerificationStatus } from "@shared/types";

interface ResearcherReviewItem {
  user_id: string;
  bio: string | null;
  institution: string | null;
  past_studies: Array<{ title: string; year: number; url?: string }>;
  verification_status: ResearcherVerificationStatus;
  users: { full_name: string; email: string };
}

import { DocumentReviewChecklist, type ReviewChecklistState } from "@/components/admin/DocumentReviewChecklist";

export function AdminResearcherQueuePage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["researcher-queue"],
    queryFn: () => api<{ items: ResearcherReviewItem[] }>("/admin/researcher-queue"),
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      decision,
      checklist,
      notes,
    }: {
      id: string;
      decision: "passed" | "failed" | "request_changes";
      checklist: ReviewChecklistState;
      notes?: string;
    }) =>
      api<{ id: string }>(`/admin/researcher-queue/${id}`, {
        body: { decision, checklist, notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["researcher-queue"] });
    },
  });

  return (
    <div>
      <SectionHeading
        subtitle="Researchers waiting for their academic/institutional identity and clearance documents to be verified."
        title="Researcher Approvals"
      />

      <Notice tone="info" title="What you are deciding">
        Review the researcher's bio, institutional affiliation, and academic credentials against the 4-point verification criteria (v4 §7.4).
      </Notice>

      <div className="mt-stack-md">
        {isLoading ? <LoadingBlock /> : null}
        {error ? <Notice tone="error">Could not load the approval queue.</Notice> : null}

        {data && data.items.length === 0 ? (
          <EmptyState icon="inbox" title="The queue is empty">
            No researchers are currently waiting for approval.
          </EmptyState>
        ) : null}

        <div className="space-y-stack-md">
          {data?.items.map((item) => (
            <Card className="p-stack-md" key={item.user_id}>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  {item.users.full_name}
                </h3>
                <p className="font-body-sm text-on-surface-variant mb-4">{item.users.email}</p>

                <div className="grid gap-stack-sm md:grid-cols-2">
                  <div className="rounded-xl border border-outline-variant bg-surface-subtle p-stack-sm">
                    <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Institution
                    </p>
                    <p className="font-body-md text-on-surface font-medium">
                      {item.institution || <span className="italic text-on-surface-variant">Not provided</span>}
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-subtle p-stack-sm">
                    <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Bio
                    </p>
                    <p className="font-body-md text-on-surface">
                      {item.bio || <span className="italic text-on-surface-variant">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="mt-stack-sm rounded-xl border border-outline-variant bg-surface-subtle p-stack-sm">
                  <p className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">
                    Past Studies &amp; Publications
                  </p>
                  {item.past_studies && item.past_studies.length > 0 ? (
                    <ul className="list-inside list-disc font-body-md text-on-surface">
                      {item.past_studies.map((study, index) => (
                        <li key={index}>
                          {study.title} ({study.year}){" "}
                          {study.url && (
                            <a href={study.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                              Link
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-body-md text-on-surface italic">No past studies listed.</p>
                  )}
                </div>

                {/* 4-Point Document Review Structured Checklist */}
                <div className="mt-stack-md">
                  <DocumentReviewChecklist
                    documentTitle={`${item.users.full_name} — Institutional Affiliation`}
                    isPending={decide.isPending && decide.variables?.id === item.user_id}
                    onSubmitDecision={({ decision, checklist, notes }) => {
                      decide.mutate({
                        id: item.user_id,
                        decision,
                        checklist,
                        notes,
                      });
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
