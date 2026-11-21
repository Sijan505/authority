import "server-only";
import { db } from "@/lib/db";

export type ProStatus = { state: "none" | "pending" | "rejected" | "expired" | "active"; note: string | null };

/** What to tell a Basic member about their Pro upgrade (Basic itself is free and never expires). */
export async function proStatus(userId: string, hasPro: boolean): Promise<ProStatus> {
  if (hasPro) return { state: "active", note: null };
  const [lastPayment, everPro] = await Promise.all([
    db.payment.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.subscription.findFirst({ where: { userId, package: "PRO", status: "ACTIVE" } }),
  ]);
  if (lastPayment?.status === "PENDING") return { state: "pending", note: null };
  if (lastPayment?.status === "REJECTED") return { state: "rejected", note: lastPayment.note };
  if (everPro) return { state: "expired", note: null };
  return { state: "none", note: null };
}
