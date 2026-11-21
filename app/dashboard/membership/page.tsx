import type { Metadata } from "next";
import { formatDate } from "@/components/ArticleCard";
import { cycleLabels, formatNPR, packages, paymentMethods } from "@/config/pricing";
import { copy } from "@/content/copy";
import { requireOnboarded } from "@/lib/access";
import { db } from "@/lib/db";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: copy.join.heading };

const statusLabel = { PENDING: "Payment pending", VERIFIED: "Verified", REJECTED: "Rejected" } as const;

export default async function MembershipPage() {
  const viewer = await requireOnboarded();
  const t = copy.join;

  const payments = await db.payment.findMany({
    where: { userId: viewer.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, amount: true, method: true, reference: true, status: true, note: true, createdAt: true, subscription: true },
  });
  const pending = payments.some((p) => p.status === "PENDING");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium text-brown">{t.heading}</h1>

      <section aria-labelledby="current-h" className="card mt-8">
        <h2 id="current-h" className="text-xl font-semibold text-brown">
          {t.current}
        </h2>
        {viewer.plan === "PRO" ? (
          <p className="mt-1">
            {packages.PRO.name} · {copy.dashboard.expires} {formatDate(viewer.proExpiresAt)}
          </p>
        ) : (
          <p className="mt-1">{t.basicCurrent}</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-6 text-3xl font-medium text-brown">{viewer.plan === "PRO" ? t.renewPro : t.upgradePro}</h2>
        {pending ? (
          <p role="status" className="card border-2" style={{ borderColor: "var(--accent)" }}>
            {t.pendingBlock}
          </p>
        ) : (
          <JoinForm />
        )}
      </section>

      {payments.length > 0 && (
        <section aria-labelledby="history-h" className="mt-12">
          <h2 id="history-h" className="text-2xl font-medium text-brown">
            {t.history}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Package</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Method</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>
                      {packages[p.subscription.package].name} {cycleLabels[p.subscription.billingCycle].toLowerCase()}
                    </td>
                    <td>{formatNPR(p.amount)}</td>
                    <td>{paymentMethods[p.method].name}</td>
                    <td>
                      {statusLabel[p.status]}
                      {p.note && <p className="text-sm italic">{p.note}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
