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

interface SurveyQueueItem {
  id: string;
  title: string;
  researcher: { full_name: string; email: string } | null;
  compliance_answer: boolean | null;
  sample_size: number;
  budget: number;
  created_at: string;
  preview_url: string | null;
}

export function SurveyQueuePage() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-queue"],
    queryFn: () => api<{ items: SurveyQueueItem[] }>("/admin/survey-queue"),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: "passed" | "failed"; notes?: string }) =>
      api<{ id: string }>(`/admin/survey-queue/${id}`, { body: { decision, notes } }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["survey-queue"] });
    },
  });

  return (
    <div>
      <SectionHeading
        subtitle="Surveys waiting for compliance and quality review before being sent to respondents."
        title="Survey Approval Queue"
      />

      <div className="mt-stack-md">
        {isLoading ? <LoadingBlock /> : null}
        {error ? <Notice tone="error">Could not load the survey queue.</Notice> : null}

        {data && data.items.length === 0 ? (
          <EmptyState icon="task_alt" title="The queue is empty">
            No surveys are waiting for review.
          </EmptyState>
        ) : null}

        <div className="space-y-stack-md">
          {data?.items.map((item) => (
            <Card className="p-stack-md" key={item.id}>
              <div className="grid gap-stack-md md:grid-cols-[200px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-subtle">
                  {item.preview_url ? (
                    <img
                      alt="Compliance document"
                      className="h-40 w-full object-cover"
                      src={item.preview_url}
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                      No document
                    </div>
                  )}
                  {item.preview_url && (
                    <div className="p-2 text-center">
                      <a href={item.preview_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-body-sm">
                        View Document
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <h3 className="mt-base font-title-md text-title-md text-on-surface">
                    {item.title}
                  </h3>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    Researcher: {item.researcher?.full_name} ({item.researcher?.email})
                  </p>

                  <div className="mt-stack-sm flex flex-wrap gap-4 font-body-sm text-body-sm">
                    <span className="rounded bg-surface-variant px-2 py-1 text-on-surface-variant">
                      Sample Size: {item.sample_size}
                    </span>
                    <span className="rounded bg-surface-variant px-2 py-1 text-on-surface-variant">
                      Budget: {item.budget.toFixed(2)} ETB
                    </span>
                    <span className={`rounded px-2 py-1 ${item.compliance_answer ? "bg-success/10 text-success" : "bg-error-container/20 text-error"}`}>
                      Compliance (Step 3): {item.compliance_answer ? "YES" : "NO"}
                    </span>
                  </div>

                  <div className="mt-stack-md">
                    {rejectingId === item.id ? (
                      <div className="space-y-stack-sm rounded-xl border border-error/30 bg-error-container/10 p-stack-md">
                        <Field label="Reason for rejection or requested corrections">
                          <Input
                            autoFocus
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Target audience mismatch or compliance concerns."
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
                            Confirm Reject / Request Correction
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
                          Request Correction / Reject
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
