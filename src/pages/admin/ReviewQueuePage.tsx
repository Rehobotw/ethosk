import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocType } from "@shared/types";
import {
  Button,
  Card,
  EmptyState,
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["review-queue"],
    queryFn: () => api<{ items: ReviewItem[] }>("/admin/review-queue"),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "passed" | "failed" }) =>
      api<{ id: string }>(`/admin/review-queue/${id}`, { body: { decision } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["review-queue"] }),
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

                  <div className="mt-stack-md flex gap-stack-sm">
                    <Button
                      icon="check"
                      loading={decide.isPending && decide.variables?.id === item.id}
                      onClick={() => decide.mutate({ id: item.id, decision: "passed" })}
                    >
                      Approve
                    </Button>
                    <Button
                      icon="close"
                      onClick={() => decide.mutate({ id: item.id, decision: "failed" })}
                      variant="danger"
                    >
                      Reject
                    </Button>
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
