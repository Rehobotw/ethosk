import { useState } from "react";
import { Button, Field, Icon, Notice } from "./ui";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDeletionModal({ isOpen, onClose }: AccountDeletionModalProps) {
  const { user, logout } = useAuth();
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toLowerCase() !== "delete") {
      setError("Please type 'DELETE' to confirm your request.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api<{ success: boolean; message: string }>("/auth/delete-request", {
        body: {
          reason: reason.trim() || undefined,
          confirm_text: confirmText.trim(),
        },
      });
      setSuccessMessage(
        response.message ||
          "Your account deletion request has been submitted under Proclamation 1321/2024.",
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not submit deletion request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    setReason("");
    setConfirmText("");
    onClose();
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
              <Icon className="text-2xl" name="warning" />
            </div>
            <div>
              <h2 className="font-title-sm text-title-sm text-on-surface">
                Request Account Deletion
              </h2>
              <p className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Proclamation 1321/2024 §17.7 Right to Erasure
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors"
            onClick={handleClose}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Content */}
        {successMessage ? (
          <div className="mt-6 space-y-4">
            <Notice tone="success">
              <div className="space-y-2">
                <p className="font-semibold text-sm">{successMessage}</p>
                <p className="text-xs">
                  A confirmation has been recorded in your consent audit log. All personal data associated with {user?.email || "your account"} will be purged within the statutory 30-day period.
                </p>
              </div>
            </Notice>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button className="flex-1" onClick={logout} variant="danger">
                Log Out Now
              </Button>
              <Button className="flex-1" onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-error/20 bg-error/5 p-4 text-xs text-on-surface-variant space-y-2">
              <p className="font-medium text-error">
                Please review the consequences of deleting your account:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Your profile information, authentication credentials, and uploaded identity documents will be permanently queued for deletion.</li>
                {user?.role === "respondent" ? (
                  <li>Any remaining wallet balance should be withdrawn prior to account deletion.</li>
                ) : (
                  <li>Responses already collected by your published surveys remain retained in anonymized format according to participant consent terms.</li>
                )}
              </ul>
            </div>

            <Field
              hint="Help us understand how we can improve (optional)"
              label="Reason for leaving"
            >
              <textarea
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 font-body-sm text-sm text-on-surface focus:border-primary focus:outline-none min-h-[80px]"
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you are deleting your account..."
                value={reason}
              />
            </Field>

            <Field
              error={error ?? undefined}
              hint="Type DELETE in capital letters to confirm"
              label="Confirmation"
            >
              <input
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm text-on-surface uppercase focus:border-error focus:outline-none"
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                type="text"
                value={confirmText}
              />
            </Field>

            {error && <Notice tone="error">{error}</Notice>}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
              <Button onClick={handleClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                disabled={confirmText.trim().toLowerCase() !== "delete"}
                loading={isSubmitting}
                type="submit"
                variant="danger"
              >
                Submit Deletion Request
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
