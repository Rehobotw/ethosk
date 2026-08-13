import { Link } from "react-router-dom";
import type { ResearcherVerificationLevel, SubscriptionTier } from "@shared/permissions";
import { Button, Icon, Modal } from "@/components/ui";

interface ExportGateModalProps {
  open: boolean;
  onClose: () => void;
  verificationLevel: ResearcherVerificationLevel;
  subscriptionTier: SubscriptionTier;
}

export function ExportGateModal({
  open,
  onClose,
  verificationLevel,
  subscriptionTier,
}: ExportGateModalProps) {
  const isVerified = verificationLevel === "id_verified";
  const isSubscribed = subscriptionTier === "subscribed";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Raw Data Export Access"
    >
      <div className="space-y-4 pt-2">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-on-surface">
              <Icon
                className={isVerified ? "text-status-passed" : "text-error"}
                name={isVerified ? "check_circle" : "cancel"}
              />
              Fayda / Ethiopian ID Verification
            </span>
            <span className="font-semibold text-on-surface">
              {isVerified ? "Verified" : "Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-on-surface">
              <Icon
                className={isSubscribed ? "text-status-passed" : "text-error"}
                name={isSubscribed ? "check_circle" : "cancel"}
              />
              Ethosk Pro Subscription
            </span>
            <span className="font-semibold text-on-surface">
              {isSubscribed ? "Subscribed" : "Free Plan"}
            </span>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Aggregated analytics, charts, and AI summaries remain accessible on the dashboard. Upgrading to Pro unlocks raw anonymized response exports with full question-by-question breakdown.
        </p>

        <div className="flex gap-2 pt-2">
          {!isVerified && (
            <Link className="flex-1" to="/researcher/profile" onClick={onClose}>
              <Button className="w-full text-xs" icon="shield" variant="outline">
                Verify Identity
              </Button>
            </Link>
          )}
          {!isSubscribed && (
            <Link className="flex-1" to="/researcher/subscription" onClick={onClose}>
              <Button className="w-full text-xs" icon="workspace_premium">
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
