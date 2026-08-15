import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Field, Icon, Notice } from "./ui";
import { api, ApiRequestError } from "@/lib/api";

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableEtb: number;
}

export function CashoutModal({ isOpen, onClose, availableEtb }: CashoutModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>(availableEtb.toFixed(2));
  const [method, setMethod] = useState<"telebirr" | "cbe_birr">("telebirr");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const withdraw = useMutation({
    mutationFn: (data: { amount_etb: number; method: string; account_number: string }) =>
      api("/wallet/respondent/withdraw", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["respondent-wallet"] });
      handleClose();
    },
    onError: (err) => {
      setError(
        err instanceof ApiRequestError ? err.message : "Withdrawal failed. Please try again.",
      );
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amountNum < 100) {
      setError("The minimum cashout amount is 100 ETB.");
      return;
    }
    if (amountNum > availableEtb) {
      setError("You cannot withdraw more than your available balance.");
      return;
    }
    if (accountNumber.trim().length < 5) {
      setError("Please enter a valid account or phone number.");
      return;
    }

    withdraw.mutate({
      amount_etb: amountNum,
      method,
      account_number: accountNumber.trim(),
    });
  };

  const handleClose = () => {
    setError(null);
    setAmount(availableEtb.toFixed(2));
    setMethod("telebirr");
    setAccountNumber("");
    onClose();
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
              <Icon className="text-2xl" name="payments" />
            </div>
            <div>
              <h2 className="font-title-sm text-title-sm text-on-surface">Withdraw Funds</h2>
              <p className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant">
                Available Balance: {availableEtb.toFixed(2)} ETB
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            onClick={handleClose}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field label="Amount to Withdraw (ETB)">
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm text-on-surface focus:border-primary focus:outline-none"
                max={availableEtb}
                min="100"
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                type="number"
                value={amount}
              />
              <Button
                onClick={() => setAmount(availableEtb.toFixed(2))}
                type="button"
                variant="outline"
              >
                Max
              </Button>
            </div>
          </Field>

          <Field label="Payout Method">
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${
                  method === "telebirr"
                    ? "border-primary bg-primary-container/20 text-primary"
                    : "border-outline-variant text-on-surface-variant"
                }`}
              >
                <input
                  checked={method === "telebirr"}
                  className="sr-only"
                  onChange={() => setMethod("telebirr")}
                  type="radio"
                  value="telebirr"
                />
                <span className="font-title-sm text-sm font-medium">Telebirr</span>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${
                  method === "cbe_birr"
                    ? "border-primary bg-primary-container/20 text-primary"
                    : "border-outline-variant text-on-surface-variant"
                }`}
              >
                <input
                  checked={method === "cbe_birr"}
                  className="sr-only"
                  onChange={() => setMethod("cbe_birr")}
                  type="radio"
                  value="cbe_birr"
                />
                <span className="font-title-sm text-sm font-medium">CBE Birr</span>
              </label>
            </div>
          </Field>

          <Field label="Account or Phone Number">
            <input
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-mono text-sm text-on-surface focus:border-primary focus:outline-none"
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 0911234567"
              type="text"
              value={accountNumber}
            />
          </Field>

          <Notice tone="info">
            Minimum payout is 100 ETB. Processing may take up to 24 hours during the pilot phase.
          </Notice>

          {error && <Notice tone="error">{error}</Notice>}

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4">
            <Button onClick={handleClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={withdraw.isPending || parseFloat(amount) < 100}
              loading={withdraw.isPending}
              type="submit"
            >
              Withdraw {parseFloat(amount || "0").toFixed(2)} ETB
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
