import "server-only";
import { allocate } from "@/lib/allocate";
import { db } from "@/lib/db";

// Revenue share, per calendar month in Nepal time (UTC+5:45). Net sales for a month
// is the total of membership payments the team verified in that month. Admin only:
// every caller (pages and actions) checks the ADMIN role first.

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/** "2026-11" → the UTC instants where that month starts and the next one starts, in Nepal time. */
export function monthBounds(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error("Invalid month.");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error("Invalid month.");
  const start = new Date(Date.UTC(y, mo - 1, 1) - NEPAL_OFFSET_MS);
  const end = new Date(Date.UTC(y, mo, 1) - NEPAL_OFFSET_MS);
  return { start, end };
}

/** The Nepal-time month ("YYYY-MM") a moment falls in. */
export function monthOf(d: Date) {
  const n = new Date(d.getTime() + NEPAL_OFFSET_MS);
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const monthLabel = (month: string) => {
  const { start } = monthBounds(month);
  return new Date(start.getTime() + NEPAL_OFFSET_MS).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
};

/** True once the month is over in Nepal. */
export const monthEnded = (month: string) => monthBounds(month).end.getTime() <= Date.now();

/** Net sales (paisa) and number of payments verified in the month. Payments are stored in whole NPR. */
export async function netSales(month: string) {
  const { start, end } = monthBounds(month);
  const r = await db.payment.aggregate({
    where: { status: "VERIFIED", verifiedAt: { gte: start, lt: end } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  return { paisa: BigInt(r._sum.amount ?? 0) * BigInt(100), count: r._count._all };
}

/** Months to show: from the first verified payment (or first finalised month) to this month, newest first. */
export async function listMonths() {
  const [first, firstPeriod] = await Promise.all([
    db.payment.findFirst({ where: { status: "VERIFIED", verifiedAt: { not: null } }, orderBy: { verifiedAt: "asc" }, select: { verifiedAt: true } }),
    db.revenuePeriod.findFirst({ orderBy: { month: "asc" }, select: { month: true } }),
  ]);
  const current = monthOf(new Date());
  const candidates = [current, first?.verifiedAt ? monthOf(first.verifiedAt) : current, firstPeriod?.month ?? current].sort();
  const months: string[] = [];
  let [y, m] = candidates[0].split("-").map(Number);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    months.push(key);
    if (key >= current || months.length > 240) break;
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return months.reverse();
}

export type Allocation = { shareholderId: string | null; name: string; role: "OWNER" | "TECHNICAL_PARTNER"; basisPoints: number; amountPaisa: bigint };

/** What each current shareholder would receive from `paisa`, or null while ownership doesn't total 100%. */
export async function previewAllocations(paisa: bigint): Promise<Allocation[] | null> {
  const holders = await db.shareholder.findMany({ orderBy: [{ basisPoints: "desc" }, { name: "asc" }] });
  if (holders.reduce((s, h) => s + h.basisPoints, 0) !== 10_000) return null;
  const amounts = allocate(paisa, holders.map((h) => ({ id: h.id, basisPoints: h.basisPoints })));
  return holders.map((h) => ({ shareholderId: h.id, name: h.name, role: h.role, basisPoints: h.basisPoints, amountPaisa: amounts.get(h.id)! }));
}
