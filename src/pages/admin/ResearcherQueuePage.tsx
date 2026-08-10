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

export function AdminResearcherQueuePage() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["researcher-queue"],
    queryFn: () => api<{ items: ResearcherReviewItem[] }>("/admin/researcher-queue"),
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      decision,
      notes,
    }: {
      id: string;
      decision: "passed" | "failed";
      notes?: string;
    }) => api<{ id: string }>(`/admin/researcher-queue/${id}`, { body: { decision, notes } }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["researcher-queue"] });
    },
  });

  return (
    <div>
      <SectionHeading
        subtitle="Researchers waiting for their academic/institutional identity to be verified."
        title="Researcher Approvals"
      />

      <Notice tone="info" title="What you are deciding">
        Review the researcher's bio, institution, and past studies. If they appear to be a legitimate researcher or academic, approve them to grant them full platform access.
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
                <h3 className="font-title-lg text-title-lg text-on-surface">
                  {item.users.full_name}
                </h3>
                <p className="font-body-sm text-on-surface-variant mb-4">{item.users.email}</p>

                <div className="grid gap-stack-sm md:grid-cols-2">
                  <div className="rounded-xl border border-outline-variant bg-surface-subtle p-stack-sm">
                    <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Institution
                    </p>
                    <p className="font-body-md text-on-surface">
                      {item.institution || <span className="italic">Not provided</span>}
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-subtle p-stack-sm">
                    <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Bio
                    </p>
                    <p className="font-body-md text-on-surface">
                      {item.bio || <span className="italic">Not provided</span>}
                    </p>
                  </div>
                </div>

                <div className="mt-stack-sm rounded-xl border border-outline-variant bg-surface-subtle p-stack-sm">
                  <p className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">
                    Past Studies
                  </p>
                  {item.past_studies && item.past_studies.length > 0 ? (
                    <ul className="list-inside list-disc font-body-md text-on-surface">
                      {item.past_studies.map((study, index) => (
                        <li key={index}>
                          {study.title} ({study.year}){" "}
                          {study.url && (
                            <a href={study.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
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

                <div className="mt-stack-md">
                  {rejectingId === item.user_id ? (
                    <div className="space-y-stack-sm rounded-xl border border-error/30 bg-error-container/10 p-stack-md">
                      <Field label="Reason for rejection (sent to researcher)">
                        <Input
                          autoFocus
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g., Institution could not be verified."
                          value={rejectReason}
                        />
                      </Field>
                      <div className="flex gap-stack-sm">
                        <Button
                          icon="close"
                          loading={decide.isPending}
                          onClick={() =>
                            decide.mutate({
                              id: item.user_id,
                              decision: "failed",
                              notes: rejectReason || "Rejected by administrator.",
                            })
                          }
                          variant="danger"
                        >
                          Confirm Reject
                        </Button>
                        <Button
                          disabled={decide.isPending}
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-stack-sm">
                      <Button
                        icon="check"
                        loading={
                          decide.isPending &&
                          decide.variables?.id === item.user_id &&
                          decide.variables.decision === "passed"
                        }
                        onClick={() => decide.mutate({ id: item.user_id, decision: "passed" })}
                      >
                        Approve
                      </Button>
                      <Button
                        disabled={decide.isPending}
                        icon="close"
                        onClick={() => setRejectingId(item.user_id)}
                        variant="danger"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
