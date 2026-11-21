// Membership packages, prices (NPR) and payment instructions.
// Basic is free and starts automatically after onboarding. Only Pro is paid.
// Pro prices are read on the server when a member submits a payment, so changing
// them here changes what new members are asked to pay.

export type PackageId = "BASIC" | "PRO";
export type CycleId = "MONTHLY" | "YEARLY";
export type MethodId = "ESEWA" | "KHALTI" | "BANK_TRANSFER";

export const CYCLE_DAYS: Record<CycleId, number> = {
  MONTHLY: 30,
  YEARLY: 365,
};

export const packages: Record<PackageId, { name: string; features: string[] }> = {
  BASIC: {
    name: "Basic",
    features: [
      "Articles from your field",
      "Your field's home page",
      "Offers and partner venue discounts for your field",
    ],
  },
  PRO: {
    name: "Pro",
    features: [
      "Everything in Basic",
      "Comment on articles in your field",
      "Share your point of view in your field's discussion feed",
      "Your field's member directory",
    ],
  },
};

/** Pro prices in NPR. Yearly is 20% off 12 × monthly. */
export const proPrices: Record<CycleId, number> = { MONTHLY: 1000, YEARLY: 9600 };
export const proYearlyFullPrice = 12000;

export const cycleLabels: Record<CycleId, string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export const paymentMethods: Record<MethodId, { name: string; instructions: string[] }> = {
  ESEWA: {
    name: "eSewa",
    instructions: [
      "Open eSewa and choose Send Money / Pay.",
      "eSewa ID: [TBC]", // TBC: eSewa merchant / wallet ID
      "Account name: [TBC]", // TBC
      "Put your registered email or WhatsApp number in the remarks.",
    ],
  },
  KHALTI: {
    name: "Khalti",
    instructions: [
      "Open Khalti and choose Send Money / Pay.",
      "Khalti ID: [TBC]", // TBC: Khalti merchant / wallet ID
      "Account name: [TBC]", // TBC
      "Put your registered email or WhatsApp number in the remarks.",
    ],
  },
  BANK_TRANSFER: {
    name: "Bank transfer",
    instructions: [
      "Bank: [TBC]", // TBC
      "Account name: [TBC]", // TBC
      "Account number: [TBC]", // TBC
      "Branch: [TBC]", // TBC
      "Put your registered email or WhatsApp number in the remarks.",
    ],
  },
};

export function formatNPR(amount: number) {
  return `NPR ${amount.toLocaleString("en-IN")}`;
}

export function proPriceOf(cycle: CycleId) {
  return proPrices[cycle];
}
