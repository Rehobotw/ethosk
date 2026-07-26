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

/**
 * Fayda ID entry. The respondent types their 12-digit FIN and the server checks
 * it against Fayda.
 *
 * The digits are held in component state only for as long as the form is open —
 * they are sent once and never persisted client-side, since the server stores only
 * a hash of the number.
 */
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

  return (
    <form
      className="mt-stack-md space-y-stack-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete && !verify.isPending) verify.mutate();
      }}
    >
      <Field
        error={fin.length > 0 && !complete ? "A Fayda ID number is 12 digits" : undefined}
        hint="Find this on your Fayda card or in the Fayda app. We check it with Fayda and never store the number itself."
        label="Fayda ID number (FIN)"
      >
        <Input
          autoComplete="off"
          inputMode="numeric"
          // Grouped as the number is printed on the card, so it is easier to
          // check against the physical ID while typing.
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "").slice(0, 12);
            setFin(next.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
          }}
          placeholder="0000 0000 0000"
          value={fin}
        />
      </Field>

      <div className="flex items-center gap-stack-sm">
        <Button disabled={!complete} icon="fingerprint" loading={verify.isPending} type="submit">
          Verify with Fayda
        </Button>
        <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <Icon className="text-[16px]" name="lock" />
          Sent directly to Fayda
        </span>
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
