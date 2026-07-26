import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Icon, Notice } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";

/**
 * Stands in for telebirr's checkout screen when no merchant credentials are
 * configured.
 *
 * Deliberately looks like part of this app rather than like telebirr: someone
 * demonstrating Ethosk should never be unsure whether a real payment just
 * happened. Confirming here posts the callback the real gateway would have sent,
 * so the deposit settles through exactly the same server path as a live payment.
 */
export function TelebirrDemoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reference = searchParams.get("reference") ?? "";
  const amount = searchParams.get("amount") ?? "";

  const complete = useMutation({
    mutationFn: () => api<{ status: string }>("/wallet/telebirr/demo-complete", { body: { reference } }),
    onSuccess: () => navigate(`/researcher/wallet?deposit=${reference}`, { replace: true }),
  });

  return (
    <div className="mx-auto max-w-md py-stack-lg">
      <Card className="p-stack-lg">
        <div className="flex items-center gap-stack-sm">
          <Icon className="text-secondary" name="smartphone" />
          <h1 className="font-headline-md text-title-sm text-primary">telebirr checkout</h1>
        </div>

        <div className="mt-stack-md">
          <Notice tone="warning" title="Simulated payment">
            This is not telebirr. No credentials are configured, so confirming credits the balance
            without any money moving.
          </Notice>
        </div>

        <dl className="mt-stack-md space-y-stack-sm border-y border-outline-variant py-stack-md">
          <div className="flex items-baseline justify-between gap-stack-md">
            <dt className="font-body-sm text-body-sm text-on-surface-variant">Amount</dt>
            <dd className="font-headline-md text-title-sm text-primary">{amount} ETB</dd>
          </div>
          <div className="flex items-baseline justify-between gap-stack-md">
            <dt className="font-body-sm text-body-sm text-on-surface-variant">Order</dt>
            <dd className="truncate font-body-sm text-body-sm text-on-surface">{reference}</dd>
          </div>
        </dl>

        {complete.isError ? (
          <div className="mt-stack-md">
            <Notice tone="error">
              {complete.error instanceof ApiRequestError
                ? complete.error.message
                : "The demo payment could not be completed."}
            </Notice>
          </div>
        ) : null}

        <div className="mt-stack-md flex flex-col gap-stack-sm">
          <Button
            disabled={!reference}
            icon="check"
            loading={complete.isPending}
            onClick={() => complete.mutate()}
          >
            Confirm payment
          </Button>
          {/* Leaving without confirming is the abandoned-checkout case, which
              should leave the deposit pending rather than failed. */}
          <Button onClick={() => navigate("/researcher/wallet")} variant="ghost">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
