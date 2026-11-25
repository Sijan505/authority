import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { copy } from "@/content/copy";
import { db } from "@/lib/db";

type Tx = Prisma.TransactionClient | typeof db;

/**
 * Posts "[Name] joined Authority as a [Field] member" in the members' group chat
 * when someone becomes a member for the first time. Renewals, and members coming
 * back after a lapse, post nothing. Call it inside the transaction that activates
 * the subscription, passing that subscription's id.
 */
export async function postGroupJoin(tx: Tx, userId: string, subscriptionId: string) {
  const earlier = await tx.subscription.count({
    where: { userId, package: "PRO", id: { not: subscriptionId }, startsAt: { not: null } },
  });
  if (earlier > 0) return;

  const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true, field: { select: { name: true } } } });
  if (!user) return;
  const body = copy.group.joined(user.name?.trim() || "A new member", user.field?.name ?? null);
  // joinKey is unique, so a person is only ever announced once.
  await tx.groupMessage.upsert({
    where: { joinKey: userId },
    create: { userId, kind: "join", body, joinKey: userId },
    update: {},
  });
}

/** Group messages posted by others since the member last opened the group. */
export async function groupUnread(userId: string, readAt: Date | null) {
  return db.groupMessage.count({
    where: { userId: { not: userId }, removedAt: null, ...(readAt ? { createdAt: { gt: readAt } } : {}) },
  });
}
