/**
 * Single source of truth for subscription plans and pricing across Ethiosk.
 * Avoids price drift across ChooseSubscriptionPlanPage, checkout, wallet, and subscription screens.
 */

export interface SubscriptionPlanDefinition {
  readonly id: "basic" | "pro" | "enterprise";
  readonly name: string;
  readonly nameAm: string;
  readonly priceEtb: number;
  readonly priceUsd: number | null;
  readonly billingPeriod: "monthly" | "annual" | "custom";
  readonly isCustom: boolean;
  readonly features: readonly string[];
}

export const SUBSCRIPTION_PLANS: Record<"basic" | "pro" | "enterprise", SubscriptionPlanDefinition> = {
  basic: {
    id: "basic",
    name: "Community Basic",
    nameAm: "መሰረታዊ ማህበረሰብ",
    priceEtb: 0,
    priceUsd: 0,
    billingPeriod: "monthly",
    isCustom: false,
    features: [
      "Up to 3 active surveys",
      "100 responses per survey",
      "Standard fraud detection",
      "Community support",
    ],
  },
  pro: {
    id: "pro",
    name: "Ethosk Pro",
    nameAm: "ኢቶስክ ፕሮ",
    priceEtb: 2500,
    priceUsd: 49,
    billingPeriod: "monthly",
    isCustom: false,
    features: [
      "Unlimited active surveys",
      "Unlimited verified responses",
      "AI Survey Generator",
      "Raw CSV & SPSS data export",
      "Priority verification & SLA",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Custom",
    nameAm: "ኢንተርፕራይዝ",
    priceEtb: 0,
    priceUsd: null,
    billingPeriod: "custom",
    isCustom: true,
    features: [
      "Dedicated institutional tenant",
      "Custom SLA & ethical clearance assistance",
      "Dedicated account manager",
      "Custom volume escrow & disbursements",
    ],
  },
} as const;

export function formatCurrencyEtb(amount: number): string {
  return `${amount.toLocaleString("en-US")} ETB`;
}

export function formatPricePerMonth(
  planId: "basic" | "pro" | "enterprise",
  currency: "ETB" | "USD" = "ETB",
): string {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (plan.isCustom) return "Custom";
  if (currency === "USD" && plan.priceUsd !== null) {
    return `$${plan.priceUsd}/mo`;
  }
  return `${formatCurrencyEtb(plan.priceEtb)}/mo`;
}
