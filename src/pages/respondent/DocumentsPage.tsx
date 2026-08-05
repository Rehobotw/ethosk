import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocReviewStatus, DocType } from "@shared/types";
import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from "@shared/validation/schemas";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  LoadingBlock,
  Notice,
  Select,
} from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface DocumentRow {
  id: string;
  doc_type: DocType;
  status: DocReviewStatus;
  ai_notes: string | null;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<DocType, string> = {
  student_id: "Student ID",
  degree: "Degree certificate",
  employer_id: "Employer ID",
};

const STATUS_CONFIG: Record<
  DocReviewStatus,
  { label: string; className: string; icon: string; description: string }
> = {
  processing: {
    label: "Pending Verification",
    className: "bg-surface-container-high text-primary border border-primary/20 animate-pulse",
    icon: "hourglass_top",
    description: "Automated verification in progress…",
  },
  passed: {
    label: "Verified",
    className: "bg-status-passed/15 text-flag-clean border border-status-passed/30 font-bold",
    icon: "verified",
    description: "Document confirmed and approved.",
  },
  failed: {
    label: "Rejected",
    className: "bg-error-container text-on-error-container border border-error/30 font-bold",
    icon: "cancel",
    description: "Document could not be verified.",
  },
  needs_review: {
    label: "Pending Manual Review",
    className: "bg-status-review/15 text-[#7c4a03] border border-status-review/30",
    icon: "person_search",
    description: "Queued for administrator review.",
  },
};

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocType>("student_id");
  const [clientError, setClientError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api<{ documents: DocumentRow[] }>("/respondents/documents"),
    // A document under automated check settles within seconds; poll until it does.
    refetchInterval: (query) =>
      query.state.data?.documents.some((doc) => doc.status === "processing") ? 3_000 : false,
  });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("doc_type", docType);
      formData.append("file", file);
      return api<{ document_id: string; status: string }>("/respondents/documents", { formData });
    },
    onSuccess: async () => {
      if (fileInput.current) fileInput.current.value = "";
      setUploadSuccess("Document uploaded successfully! Review is in progress.");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await refresh();
    },
  });

  const handleFile = (file: File | undefined) => {
    setClientError(null);
    if (!file) return;

    // The same rules run server-side; this check only makes the feedback instant.
    if (!ACCEPTED_UPLOAD_MIME_TYPES.includes(file.type as (typeof ACCEPTED_UPLOAD_MIME_TYPES)[number])) {
      setClientError("That file type is not supported. Upload a JPEG, PNG, or PDF.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setClientError("That file is larger than 8MB. Upload a smaller version.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    upload.mutate(file);
  };

  return (
    <div className="space-y-stack-md">
      <div>
        <h1 className="font-headline-md text-headline-md text-primary">Supporting documents</h1>
        <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
          Upload a document that backs up the institution or employer on your profile.
        </p>
      </div>

      <div className="grid gap-stack-md lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-stack-md">
          <Notice tone="info" title="What this check does">
            We check that the image is legible and consistent with your profile. We do not claim to
            detect forgery, and an unclear photo is sent to a person rather than rejected outright.
          </Notice>

          <Card className="p-stack-md">
            <Field label="Document type">
              <Select
                onChange={(event) => setDocType(event.target.value as DocType)}
                value={docType}
              >
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <input
              accept={ACCEPTED_UPLOAD_MIME_TYPES.join(",")}
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />

            <Button
              className="mt-stack-md w-full"
              icon="upload_file"
              loading={upload.isPending}
              onClick={() => fileInput.current?.click()}
            >
              Choose a file
            </Button>

            <p className="mt-stack-sm text-center font-body-sm text-[12px] text-on-surface-variant">
              JPEG, PNG, or PDF · up to 8MB
            </p>

            {uploadSuccess ? (
              <div className="mt-stack-md">
                <Notice tone="success">{uploadSuccess}</Notice>
              </div>
            ) : null}

            {clientError ? (
              <div className="mt-stack-md">
                <Notice tone="error">{clientError}</Notice>
              </div>
            ) : null}

            {upload.error ? (
              <div className="mt-stack-md">
                <Notice tone="error">
                  {upload.error instanceof ApiRequestError
                    ? upload.error.message
                    : "The upload did not complete."}
                </Notice>
              </div>
            ) : null}
          </Card>
        </div>

        <section>
          <h2 className="mb-stack-sm font-title-sm text-title-sm text-on-surface">Your uploads</h2>

          {isLoading ? <LoadingBlock /> : null}

          {data && data.documents.length === 0 ? (
            <EmptyState icon="description" title="Nothing uploaded yet">
              Your uploads and their review status will appear here.
            </EmptyState>
          ) : null}

          <div className="space-y-stack-sm">
            {data?.documents.map((document) => {
              const status = STATUS_CONFIG[document.status];
              return (
                <Card className="p-stack-md" key={document.id}>
                  <div className="flex items-start justify-between gap-stack-sm">
                    <div>
                      <p className="font-title-sm text-body-md text-on-surface">
                        {DOC_TYPE_LABELS[document.doc_type]}
                      </p>
                      <p className="mt-base font-body-sm text-[12px] text-on-surface-variant">
                        {new Date(document.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 font-status-badge text-status-badge ${status.className}`}
                    >
                      <Icon className="text-[14px]" filled name={status.icon} />
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-2 font-body-sm text-[13px] text-on-surface-variant/80">
                    {status.description}
                  </p>
                  {document.ai_notes ? (
                    <p className="mt-stack-sm rounded-lg bg-surface-container-high/50 p-2 font-body-sm text-body-sm text-on-surface-variant border border-outline-variant/40">
                      <span className="font-semibold text-on-surface">Review notes: </span>
                      {document.ai_notes}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
