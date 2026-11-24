import Link from "next/link";
import { formatPaisa, formatPercent } from "@/lib/allocate";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { listMonths, monthEnded, monthLabel, netSales, previewAllocations, type Allocation } from "@/lib/revenue";
import { PeriodAction, ROLE_LABEL } from "../shareholders/forms";

export const metadata = { title: "Revenue share" };

/**
 * Monthly revenue share. Net sales = membership payments verified in the month
 * (Nepal time). Open months show a live split by today's shares; finalised months
 * show the amounts saved when they were finalised. Admin only.
 */
export default async function RevenuePage() {
  await requireAdmin();
  const [months, periods, holderCount] = await Promise.all([
    listMonths(),
    db.revenuePeriod.findMany({ include: { allocations: { orderBy: [{ basisPoints: "desc" }, { name: "asc" }] } } }),
    db.shareholder.count(),
  ]);
  const byMonth = new Map(periods.map((p) => [p.month, p]));

  const rows = await Promise.all(
    months.map(async (month) => {
      const p = byMonth.get(month);
      if (p?.status === "FINALIZED") {
        const allocations: Allocation[] = p.allocations.map((a) => ({ shareholderId: a.shareholderId, name: a.name, role: a.role, basisPoints: a.basisPoints, amountPaisa: a.amountPaisa }));
        return { month, finalized: true, net: p.netSalesPaisa, count: p.paymentCount, allocations, finalizedAt: p.finalizedAt };
      }
      const sales = await netSales(month);
      return { month, finalized: false, net: sales.paisa, count: sales.count, allocations: await previewAllocations(sales.paisa), finalizedAt: null };
    }),
  );
  const finalizedTotal = rows.filter((r) => r.finalized).reduce((s, r) => s + r.net, BigInt(0));

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">Revenue share</h1>
        <Link href="/admin/shareholders" className="link">
          Shareholders →
        </Link>
      </div>
      <p className="mt-2 max-w-[70ch] text-mute">
        Net sales for each month is the total of membership payments verified in it (Nepal time). It is split by ownership to the paisa; leftover paisa
        go to whoever was rounded down most, so the amounts always add up exactly to net sales. Finalising saves the split; reopening lets you correct it.
      </p>
      <p className="mt-3 text-sm text-mute">
        Finalised net sales, all months: <b className="tabular-nums text-brown">{formatPaisa(finalizedTotal)}</b>
      </p>

      {holderCount === 0 && (
        <p className="mt-6 card border-2 border-error">
          No shareholders yet.{" "}
          <Link href="/admin/shareholders" className="link">
            Add the owners and the technical partner
          </Link>{" "}
          first.
        </p>
      )}

      <ul className="mt-8 space-y-4">
        {rows.map((r) => {
          const label = monthLabel(r.month);
          const sum = r.allocations?.reduce((s, a) => s + a.amountPaisa, BigInt(0)) ?? BigInt(0);
          return (
            <li key={r.month} className={`card ${r.finalized ? "border-gold" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-brown">{label}</h2>
                  <p className="mt-1 text-sm text-mute">
                    {r.finalized ? (
                      <>
                        <span className="font-semibold text-brown">Finalised</span>
                        {r.finalizedAt && <> · {r.finalizedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kathmandu" })}</>}
                      </>
                    ) : (
                      <>Open · live figures{!monthEnded(r.month) && " · month not over yet; payments verified later in the month will be added"}</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-mute">Net sales</p>
                  <p className="text-2xl font-semibold tabular-nums text-brown">{formatPaisa(r.net)}</p>
                  <p className="text-sm text-mute">
                    {r.count} verified payment{r.count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {r.allocations ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="table-admin">
                    <thead>
                      <tr>
                        <th scope="col">Shareholder</th>
                        <th scope="col">Role</th>
                        <th scope="col" className="text-right">
                          Share
                        </th>
                        <th scope="col" className="text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.allocations.map((a, i) => (
                        <tr key={a.shareholderId ?? `${a.name}-${i}`}>
                          <td>{a.name}</td>
                          <td>{ROLE_LABEL[a.role]}</td>
                          <td className="text-right tabular-nums">{formatPercent(a.basisPoints)}</td>
                          <td className="text-right tabular-nums">{formatPaisa(a.amountPaisa)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2} className="font-semibold">
                          Total
                        </td>
                        <td className="text-right font-semibold tabular-nums">{formatPercent(r.allocations.reduce((s, a) => s + a.basisPoints, 0))}</td>
                        <td className="text-right font-semibold tabular-nums">
                          {formatPaisa(sum)} {sum === r.net ? "✓" : "≠ net sales"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm text-error">
                  Ownership doesn&apos;t total 100%, so there is no split yet.{" "}
                  <Link href="/admin/shareholders" className="link">
                    Fix the shareholders
                  </Link>
                  .
                </p>
              )}

              <div className="mt-4 flex justify-end">
                {r.finalized ? (
                  <PeriodAction month={r.month} label={label} mode="reopen" />
                ) : (
                  r.allocations && <PeriodAction month={r.month} label={label} mode="finalize" />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
