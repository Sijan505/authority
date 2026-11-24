import "server-only";
import type { Viewer } from "@/lib/access";
import { db } from "@/lib/db";

/** "morning" / "afternoon" / "evening" in Nepal time, for the app's greeting. */
export function partOfDay(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kathmandu" }).format(now));
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

/**
 * The member's number: their place in the order people first became members
 * (earliest verified membership start). Null for anyone who isn't a member.
 */
export async function memberNumber(viewer: Viewer | null) {
  if (!viewer || viewer.plan !== "PRO") return null;
  return memberNumberOf(viewer.user.id);
}

/** The same number for any user id (the caller checks they are a member). */
export async function memberNumberOf(userId: string) {
  const mine = await db.subscription.findFirst({
    where: { userId, package: "PRO", status: "ACTIVE", startsAt: { not: null } },
    orderBy: { startsAt: "asc" },
    select: { startsAt: true },
  });
  if (!mine?.startsAt) return null;
  const earlier = await db.subscription.groupBy({
    by: ["userId"],
    where: { package: "PRO", status: "ACTIVE", startsAt: { lt: mine.startsAt } },
  });
  return earlier.filter((r) => r.userId !== userId).length + 1;
}

export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * The user holding member number `n` (the order people first became members), or
 * null. Mirrors memberNumberOf: earliest verified membership start decides the order.
 */
export async function userIdByMemberNumber(n: number) {
  if (!Number.isInteger(n) || n < 1) return null;
  const firsts = await db.subscription.groupBy({
    by: ["userId"],
    where: { package: "PRO", status: "ACTIVE", startsAt: { not: null } },
    _min: { startsAt: true },
  });
  firsts.sort((a, b) => (a._min.startsAt?.getTime() ?? 0) - (b._min.startsAt?.getTime() ?? 0));
  return firsts[n - 1]?.userId ?? null;
}
