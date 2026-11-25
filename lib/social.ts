import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { groupUnread } from "@/lib/group";

// Members connecting and messaging. Only active (paying, verified) members take part,
// on both sides; blocks in either direction hide people from each other completely.

/** Users with an active membership right now. */
export const activeMemberWhere = (): Prisma.UserWhereInput => {
  const now = new Date();
  return {
    status: "ACTIVE",
    onboardedAt: { not: null },
    subscriptions: { some: { package: "PRO", status: "ACTIVE", startsAt: { lte: now }, expiresAt: { gt: now } } },
  };
};

export async function isActiveMember(userId: string) {
  return (await db.user.count({ where: { id: userId, ...activeMemberWhere() } })) > 0;
}

/** True if either user has blocked the other. */
export async function blockedEitherWay(a: string, b: string) {
  return (
    (await db.userBlock.count({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    })) > 0
  );
}

/** The connection row between two users, whichever of them asked. */
export function connectionBetween(a: string, b: string) {
  return db.connection.findFirst({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

export type Relation = "none" | "sent" | "received" | "connected";

/** How the viewer relates to another member, from the viewer's side. */
export function relationOf(viewerId: string, c: { requesterId: string; status: string } | null): Relation {
  if (!c || c.status === "DECLINED") return "none";
  if (c.status === "ACCEPTED") return "connected";
  return c.requesterId === viewerId ? "sent" : "received";
}

export async function areConnected(a: string, b: string) {
  const c = await connectionBetween(a, b);
  return c?.status === "ACCEPTED";
}

/** Counts for the app's tab badges and bell. */
export async function socialCounts(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { groupReadAt: true } });
  const [direct, group, requests, notifications] = await Promise.all([
    db.message.count({ where: { recipientId: userId, readAt: null } }),
    (await isActiveMember(userId)) ? groupUnread(userId, user?.groupReadAt ?? null) : 0,
    db.connection.count({ where: { addresseeId: userId, status: "PENDING" } }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { messages: direct + group, requests, notifications };
}

/** Ids hidden from the viewer: anyone they blocked or who blocked them. */
export async function blockedIds(userId: string) {
  const rows = await db.userBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
  return rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId));
}
