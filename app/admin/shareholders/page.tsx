import Link from "next/link";
import { formatPercent } from "@/lib/allocate";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { DeleteShareholder, ROLE_LABEL, ShareholderForm } from "./forms";

export const metadata = { title: "Shareholders" };

/** The owners and the technical partner, with their ownership shares. Admin only. */
export default async function ShareholdersPage() {
  await requireAdmin();
  const holders = await db.shareholder.findMany({ orderBy: [{ basisPoints: "desc" }, { name: "asc" }] });
  const total = holders.reduce((s, h) => s + h.basisPoints, 0);
  const ok = total === 10_000;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">Shareholders</h1>
        <Link href="/admin/revenue" className="link">
          Revenue share →
        </Link>
      </div>
      <p className="mt-2 max-w-[70ch] text-mute">
        The owners and the technical partner, each with a fixed ownership share. Each month&apos;s net sales are split by these shares when you finalise it.
        Changing a share here only affects months you finalise afterwards.
      </p>

      <section aria-labelledby="total-h" className={`mt-8 card border-2 ${ok ? "border-gold" : "border-error"}`}>
        <h2 id="total-h" className="text-lg font-semibold text-brown">
          Total ownership: <span className="tabular-nums">{formatPercent(total)}</span>
        </h2>
        <p className={`mt-1 text-sm ${ok ? "text-mute" : "text-error"}`}>
          {ok
            ? "Shares total exactly 100%, so months can be finalised."
            : `Shares must total exactly 100% before a month can be finalised (${total < 10_000 ? `${formatPercent(10_000 - total)} unassigned` : `${formatPercent(total - 10_000)} over`}).`}
        </p>
      </section>

      <ul className="mt-8 space-y-4">
        {holders.map((h) => (
          <li key={h.id} className="card">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <p>
                <b className="font-semibold">{h.name}</b> <span className="text-mute">· {ROLE_LABEL[h.role]}</span>{" "}
                <span className="ml-1 font-semibold tabular-nums text-brown">{formatPercent(h.basisPoints)}</span>
              </p>
              <DeleteShareholder id={h.id} name={h.name} />
            </div>
            <ShareholderForm holder={{ id: h.id, name: h.name, role: h.role, percent: (h.basisPoints / 100).toFixed(2) }} />
          </li>
        ))}
      </ul>

      <section aria-labelledby="add-h" className="mt-8 card">
        <h2 id="add-h" className="mb-4 text-xl font-medium text-brown">
          Add a shareholder
        </h2>
        <ShareholderForm />
      </section>
    </>
  );
}
