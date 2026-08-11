import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocType } from "@shared/types";
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

interface ReviewItem {
  id: string;
  user_id: string;
  doc_type: DocType;
  ai_notes: string | null;
  created_at: string;
  respondent: { full_name: string; email: string; verification_tier: string } | null;
  preview_url: string | null;
}

export function AdminReviewQueuePage() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api<{ items: ReviewItem[] }>("/admin/review-queue"),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: "passed" | "failed"; notes?: string }) =>
      api<{ id: string }>(`/admin/review-queue/${id}`, { body: { decision, notes } }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });

  return (
    <div>
      <SectionHeading
        subtitle="Documents the automated check could not decide, oldest first."
        title="Review Queue"
      />

      <Notice tone="info" title="What you are deciding">
        The automated check only judges legibility and consistency with the claimed profile. It does
        not detect forgery, so treat an unclear image as unresolved rather than fraudulent.
      </Notice>

      <div className="mt-stack-md">
        {isLoading ? <LoadingBlock /> : null}
        {error ? <Notice tone="error">Could not load the review queue.</Notice> : null}

        {data && data.items.length === 0 ? (
          <EmptyState icon="inbox" title="The queue is empty">
            Nothing is waiting on a human decision.
          </EmptyState>
        ) : null}

        <div className="space-y-stack-md">
          {data?.items.map((item) => (
            <Card className="p-stack-md" key={item.id}>
              <div className="grid gap-stack-md md:grid-cols-[200px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-subtle">
                  {item.preview_url ? (
                    <img
                      alt={`Uploaded ${item.doc_type.replace("_", " ")}`}
                      className="h-40 w-full object-cover"
                      src={item.preview_url}
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                      No preview
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {item.doc_type.replace("_", " ")} ·{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <h3 className="mt-base font-title-sm text-title-sm text-on-surface">
                    {item.respondent?.full_name ?? "Unknown respondent"}
                  </h3>

                  {item.ai_notes ? (
                    <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
                      {item.ai_notes}
                    </p>
                  ) : null}

                  <div className="mt-stack-md">
                    {rejectingId === item.id ? (
                      <div className="space-y-stack-sm rounded-xl border border-error/30 bg-error-container/10 p-stack-md">
                        <Field label="Reason for rejection (sent to respondent)">
                          <Input
                            autoFocus
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Image is too blurry to read."
                            value={rejectReason}
                          />
                        </Field>
                        <div className="flex gap-stack-sm">
                          <Button
                            icon="close"
                            loading={decide.isPending}
                            onClick={() =>
                              decide.mutate({
                                id: item.id,
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
                          loading={decide.isPending && decide.variables?.id === item.id && decide.variables.decision === "passed"}
                          onClick={() => decide.mutate({ id: item.id, decision: "passed" })}
                        >
                          Approve
                        </Button>
                        <Button
                          disabled={decide.isPending}
                          icon="close"
                          onClick={() => setRejectingId(item.id)}
                          variant="danger"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
