import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { VerificationTier } from "@shared/types";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";

interface VerifyResult {
  verification_tier: VerificationTier;
  verified_at: string;
  live: boolean;
}

export function FaydaVerifyForm({ onVerified }: { onVerified: () => Promise<void> | void }) {
  const [fin, setFin] = useState("");

  const digits = fin.replace(/\D/g, "");
  const complete = digits.length === 12;

  const verify = useMutation({
    mutationFn: () =>
      api<VerifyResult>("/respondents/verify-fayda", { body: { fayda_id: digits } }),
    onSuccess: async () => {
      setFin("");
      await onVerified();
    },
  });

  const handleFillDemo = () => {
    setFin("3000 0000 0001");
  };

  return (
    <form
      className="mt-stack-md space-y-stack-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete && !verify.isPending) verify.mutate();
      }}
    >
      <Field
        action={
          <button
            className="font-label-caps text-[11px] font-semibold uppercase text-primary hover:underline"
            onClick={handleFillDemo}
            type="button"
          >
            ⚡ Auto-Fill Demo ID
          </button>
        }
        error={fin.length > 0 && !complete ? "A Fayda ID number is 12 digits" : undefined}
        hint="Find this on your Fayda card or in the Fayda app. We check it with Fayda and never store the number itself."
        label="Fayda ID number (FIN)"
      >
        <Input
          autoComplete="off"
          inputMode="numeric"
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "").slice(0, 12);
            setFin(next.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
          }}
          placeholder="3000 0000 0001"
          value={fin}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-stack-sm pt-1">
        <Button
          className={
            complete
              ? "!bg-status-passed hover:!bg-status-passed/90 !text-white shadow-md ring-2 ring-status-passed/40 transition-all duration-200"
              : undefined
          }
          disabled={!complete}
          icon={complete ? "verified_user" : "fingerprint"}
          loading={verify.isPending}
          type="submit"
        >
          Verify with Fayda
        </Button>
        <Button onClick={handleFillDemo} type="button" variant="outline">
          Use Demo FIN
        </Button>
        {complete ? (
          <span className="inline-flex items-center gap-1 font-body-sm text-body-sm font-medium text-status-passed animate-fade-in">
            <Icon className="text-[16px]" filled name="check_circle" />
            12 digits entered — ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <Icon className="text-[16px]" name="lock" />
            Sent directly to Fayda
          </span>
        )}
      </div>

      {verify.error ? (
        <Notice tone="error">
          {verify.error instanceof ApiRequestError
            ? verify.error.message
            : "Verification could not complete. Please try again."}
        </Notice>
      ) : null}

      {verify.data && !verify.data.live ? (
        <Notice tone="warning" title="Verified against the demo directory">
          Live Fayda credentials are not configured in this environment, so a seeded
          demo ID was accepted. Set FAYDA_API_BASE_URL and FAYDA_API_KEY to verify
          against the real service.
        </Notice>
      ) : null}
    </form>
  );
}
