import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | typeof db;

export function audit(
  tx: Tx,
  entry: { actorId: string | null; action: string; targetType: string; targetId: string; details?: Prisma.InputJsonValue },
) {
  return tx.auditLog.create({ data: entry });
}
