"use server";

import { revalidatePath } from "next/cache";
import { allocate, formatPaisa, formatPercent } from "@/lib/allocate";
import { AccessError, assertAdmin } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { monthBounds } from "@/lib/revenue";
import { fieldErrors, monthSchema, shareholderSchema, type ActionState } from "@/lib/validation";

// Shareholders and revenue share. Every action checks the ADMIN role on the server
// (assertAdmin) and records what it did in the audit log.

const LIMIT = { max: 60, windowSeconds: 600 };
const refresh = () => {
  revalidatePath("/admin/shareholders");
  revalidatePath("/admin/revenue");
};

/** Add a shareholder, or change one. Finalised months keep the shares they were finalised with. */
export async function saveShareholder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = shareholderSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name") ?? "",
      role: formData.get("role"),
      percent: String(formData.get("percent") ?? ""),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the form." };
    const { id, name, role, percent } = parsed.data;

    const saved = id
      ? await db.shareholder.update({ where: { id }, data: { name, role, basisPoints: percent } })
      : await db.shareholder.create({ data: { name, role, basisPoints: percent } });
    await audit(db, {
      actorId: admin.user.id,
      action: id ? "shareholder.update" : "shareholder.create",
      targetType: "shareholder",
      targetId: saved.id,
      details: { name, role, percent: formatPercent(percent) },
    });
    refresh();
    return { ok: true, message: "Saved." };
  });
}

/** Remove a shareholder. Their past allocations stay on finalised months, under the saved name. */
export async function deleteShareholder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const id = String(formData.get("id") ?? "");
    const holder = await db.shareholder.findUnique({ where: { id } });
    if (!holder) return { ok: true };
    await db.shareholder.delete({ where: { id } });
    await audit(db, {
      actorId: admin.user.id,
      action: "shareholder.delete",
      targetType: "shareholder",
      targetId: id,
      details: { name: holder.name, role: holder.role, percent: formatPercent(holder.basisPoints) },
    });
    refresh();
    return { ok: true, message: "Removed." };
  });
}

/**
 * Finalises a month: works out net sales from the payments verified in it, splits it
 * between the current shareholders, and saves the amounts with the shares used. The
 * ownership must total exactly 100%, and the amounts always add up to net sales.
 */
export async function finalizeMonth(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = monthSchema.safeParse({ month: formData.get("month") });
    if (!parsed.success) return { message: "Invalid month." };
    const { month } = parsed.data;
    const { start, end } = monthBounds(month);

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.revenuePeriod.findUnique({ where: { month } });
      if (existing?.status === "FINALIZED") throw new AccessError("This month is already finalised.");

      const holders = await tx.shareholder.findMany();
      if (holders.length === 0) throw new AccessError("Add the shareholders first.");
      const total = holders.reduce((s, h) => s + h.basisPoints, 0);
      if (total !== 10_000) throw new AccessError(`Ownership must total exactly 100% to finalise. It is ${formatPercent(total)}.`);

      const sales = await tx.payment.aggregate({
        where: { status: "VERIFIED", verifiedAt: { gte: start, lt: end } },
        _sum: { amount: true },
        _count: { _all: true },
      });
      const net = BigInt(sales._sum.amount ?? 0) * BigInt(100); // payments are whole NPR; store paisa
      const amounts = allocate(net, holders.map((h) => ({ id: h.id, basisPoints: h.basisPoints })));
      const sum = [...amounts.values()].reduce((a, b) => a + b, BigInt(0));
      if (sum !== net) throw new Error("Allocation does not add up to net sales."); // cannot happen; never save if it did

      const period = existing
        ? await tx.revenuePeriod.update({
            where: { id: existing.id },
            data: { status: "FINALIZED", netSalesPaisa: net, paymentCount: sales._count._all, finalizedAt: new Date(), finalizedById: admin.user.id },
          })
        : await tx.revenuePeriod.create({
            data: { month, status: "FINALIZED", netSalesPaisa: net, paymentCount: sales._count._all, finalizedAt: new Date(), finalizedById: admin.user.id },
          });
      await tx.revenueAllocation.deleteMany({ where: { periodId: period.id } });
      await tx.revenueAllocation.createMany({
        data: holders.map((h) => ({ periodId: period.id, shareholderId: h.id, name: h.name, role: h.role, basisPoints: h.basisPoints, amountPaisa: amounts.get(h.id)! })),
      });
      await audit(tx, {
        actorId: admin.user.id,
        action: "revenue.finalize",
        targetType: "revenue_period",
        targetId: period.id,
        details: {
          month,
          netSales: formatPaisa(net),
          payments: sales._count._all,
          allocations: holders.map((h) => ({ name: h.name, percent: formatPercent(h.basisPoints), amount: formatPaisa(amounts.get(h.id)!) })),
        },
      });
      return net;
    });

    refresh();
    return { ok: true, message: `Finalised. Net sales ${formatPaisa(result)} allocated.` };
  });
}

/** Reopens a finalised month so it can be corrected and finalised again. */
export async function reopenMonth(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = monthSchema.safeParse({ month: formData.get("month") });
    if (!parsed.success) return { message: "Invalid month." };
    const { month } = parsed.data;

    await db.$transaction(async (tx) => {
      const period = await tx.revenuePeriod.findUnique({ where: { month }, include: { allocations: true } });
      if (!period || period.status !== "FINALIZED") throw new AccessError("This month isn't finalised.");
      await tx.revenueAllocation.deleteMany({ where: { periodId: period.id } });
      await tx.revenuePeriod.update({ where: { id: period.id }, data: { status: "OPEN", finalizedAt: null, finalizedById: null } });
      await audit(tx, {
        actorId: admin.user.id,
        action: "revenue.reopen",
        targetType: "revenue_period",
        targetId: period.id,
        details: {
          month,
          previousNetSales: formatPaisa(period.netSalesPaisa),
          previousAllocations: period.allocations.map((a) => ({ name: a.name, percent: formatPercent(a.basisPoints), amount: formatPaisa(a.amountPaisa) })),
        },
      });
    });

    refresh();
    return { ok: true, message: "Reopened. Finalise it again when it's correct." };
  });
}
