import { formatDate } from "@/components/ArticleCard";
import { cycleLabels, formatNPR, packages, paymentMethods } from "@/config/pricing";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { ReviewPaymentForm } from "../forms";

const paymentSelect = {
  id: true,
  amount: true,
  method: true,
  reference: true,
  status: true,
  note: true,
  createdAt: true,
  verifiedAt: true,
  screenshotType: true,
  user: { select: { name: true, email: true, contact: true, field: { select: { name: true } } } },
  verifiedBy: { select: { name: true, email: true } },
  subscription: { select: { package: true, billingCycle: true, startsAt: true, expiresAt: true } },
} as const;

export default async function AdminPayments() {
  await requireAdmin();
  const [pending, reviewed] = await Promise.all([
    db.payment.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, select: paymentSelect }),
    db.payment.findMany({ where: { status: { not: "PENDING" } }, orderBy: { verifiedAt: "desc" }, take: 30, select: paymentSelect }),
  ]);

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Payments</h1>
      <p className="mt-2">
        Check each payment in eSewa, Khalti or the bank statement before verifying. Verifying activates the membership
        (monthly = 30 days, yearly = 365 days). A renewal starts when the member&apos;s current period of the same package
        ends; a first payment starts the membership immediately.
      </p>

      <h2 className="mt-10 text-2xl font-medium text-brown">Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="mt-3">Nothing waiting.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {pending.map((p) => (
            <li key={p.id} className="card grid gap-4 md:grid-cols-[1fr_20rem]">
              <div>
                <p className="text-xl font-semibold text-brown">
                  {p.user.name ?? p.user.email} · {formatNPR(p.amount)}
                </p>
                <p>
                  {packages[p.subscription.package].name} {cycleLabels[p.subscription.billingCycle].toLowerCase()} ·{" "}
                  {paymentMethods[p.method].name} · {p.user.field?.name ?? "No field"}
                </p>
                <p className="mt-1 text-sm">
                  {p.user.email}
                  {p.user.contact && p.user.contact !== p.user.email && <> · {p.user.contact}</>} · submitted {formatDate(p.createdAt)}
                </p>
                <p className="mt-2">
                  Reference: <strong className="text-brown">{p.reference || "—"}</strong>
                </p>
                {p.screenshotType && (
                  <a href={`/api/payments/${p.id}/screenshot`} target="_blank" rel="noopener noreferrer" className="link">
                    View screenshot ({p.screenshotType.split("/")[1]})
                  </a>
                )}
              </div>
              <ReviewPaymentForm paymentId={p.id} />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-2xl font-medium text-brown">Recently reviewed</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Package</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">By</th>
              <th scope="col">Active</th>
            </tr>
          </thead>
          <tbody>
            {reviewed.map((p) => (
              <tr key={p.id}>
                <td>{p.user.name ?? p.user.email}</td>
                <td>
                  {packages[p.subscription.package].name} {cycleLabels[p.subscription.billingCycle].toLowerCase()}
                </td>
                <td>{formatNPR(p.amount)}</td>
                <td>
                  {p.status === "VERIFIED" ? "Verified" : "Rejected"}
                  {p.note && <p className="text-sm italic">{p.note}</p>}
                </td>
                <td>
                  {p.verifiedBy?.name ?? p.verifiedBy?.email}
                  <p className="text-sm">{formatDate(p.verifiedAt)}</p>
                </td>
                <td className="text-sm">
                  {p.subscription.startsAt && (
                    <>
                      {formatDate(p.subscription.startsAt)} – {formatDate(p.subscription.expiresAt)}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
