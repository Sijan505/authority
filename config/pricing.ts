// Membership packages, prices (NPR) and payment instructions.
// There is one plan, shown on the site as "Member". It is paid, and it starts once
// an admin verifies the payment. Internally (database, code) it is still called PRO.
// Prices are read on the server when a member submits a payment, so changing them
// here changes what new members are asked to pay. BASIC is retired: there is no free plan.

export type PackageId = "BASIC" | "PRO";
export type CycleId = "MONTHLY" | "YEARLY";
export type MethodId = "ESEWA" | "KHALTI" | "BANK_TRANSFER";

export const CYCLE_DAYS: Record<CycleId, number> = {
  MONTHLY: 30,
  YEARLY: 365,
};

export const packages: Record<PackageId, { name: string; features: string[] }> = {
  BASIC: { name: "Basic (retired)", features: [] },
  PRO: {
    name: "Member",
    features: [
      "Full articles from your field",
      "Your field's home page and partner venue offers",
      "Comment on articles in your field",
      "Share your point of view in your field's discussion feed",
      "Your field's member directory",
    ],
  },
};

/** Membership prices in NPR. Yearly is 20% off 12 × monthly. */
export const proPrices: Record<CycleId, number> = { MONTHLY: 1000, YEARLY: 9600 };
export const proYearlyFullPrice = 12000;

export const cycleLabels: Record<CycleId, string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// `available: false` hides a method from members until its details are filled in.
export const paymentMethods: Record<MethodId, { name: string; available: boolean; instructions: string[] }> = {
  ESEWA: {
    name: "eSewa",
    available: true,
    instructions: [
      "Open eSewa and choose Send Money.",
      "eSewa ID: 9826204197",
      "Account name: SIJAN KC",
      "Put your registered email or WhatsApp number in the remarks.",
    ],
  },
  KHALTI: {
    name: "Khalti",
    available: true,
    instructions: [
      "Open Khalti and choose Send Money.",
      "Khalti ID: 9826204197",
      "Account name: SIJAN KC",
      "Put your registered email or WhatsApp number in the remarks.",
    ],
  },
  BANK_TRANSFER: {
    name: "Bank transfer",
    available: false, // TBC: set to true once the bank details below are filled in
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

/** Methods members can choose right now. */
export const availableMethods = () => (Object.keys(paymentMethods) as MethodId[]).filter((id) => paymentMethods[id].available);

export function proPriceOf(cycle: CycleId) {
  return proPrices[cycle];
}
