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
  const mine = await db.subscription.findFirst({
    where: { userId: viewer.user.id, package: "PRO", status: "ACTIVE", startsAt: { not: null } },
    orderBy: { startsAt: "asc" },
    select: { startsAt: true },
  });
  if (!mine?.startsAt) return null;
  const earlier = await db.subscription.groupBy({
    by: ["userId"],
    where: { package: "PRO", status: "ACTIVE", startsAt: { lt: mine.startsAt } },
  });
  return earlier.filter((r) => r.userId !== viewer.user.id).length + 1;
}

export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";
