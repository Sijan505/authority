import "server-only";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { RENEWAL_REMINDER_DAYS } from "@/config/site";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Every access decision is made here, on the server, from the database.
// Pages, server actions and API routes all call these helpers.

export type Plan = "BASIC" | "PRO";

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

/** The signed-in user with their current paid access, or null. Cached per request. */
export const getViewer = cache(async () => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({ where: { id }, include: { field: true } });
  if (!user) return null;

  const now = new Date();
  // Active Pro = verified by an admin, started, and not yet expired.
  const active = await db.subscription.findMany({
    where: { userId: id, package: "PRO", status: "ACTIVE", expiresAt: { gt: now } },
    orderBy: { expiresAt: "desc" },
  });
  const hasPro = active.some((s) => s.startsAt && s.startsAt <= now);

  const suspended = user.status === "SUSPENDED";
  const onboarded = !!user.onboardedAt && !!user.fieldId;
  // Basic is free: every onboarded, non-suspended member has it. Pro needs a verified payment.
  const plan: Plan | null = suspended || !onboarded ? null : hasPro ? "PRO" : "BASIC";

  // Latest Pro expiry across the current period and already-paid renewals.
  const proExpiresAt = plan === "PRO" ? (active[0]?.expiresAt ?? null) : null;
  const daysLeft = proExpiresAt ? Math.ceil((proExpiresAt.getTime() - now.getTime()) / 86_400_000) : null;

  return {
    user,
    plan,
    suspended,
    isAdmin: user.role === "ADMIN" && !suspended,
    onboarded,
    proExpiresAt,
    daysLeft,
    showRenewal: daysLeft !== null && daysLeft <= RENEWAL_REMINDER_DAYS,
  };
});

/** Viewer can read full articles of this field. */
export function canReadField(viewer: Viewer | null, fieldId: string) {
  if (!viewer) return false;
  if (viewer.isAdmin) return true;
  return viewer.plan !== null && viewer.user.fieldId === fieldId;
}

/** Viewer can use Pro features (comments, feed, directory) in this field. */
export function canUsePro(viewer: Viewer | null, fieldId: string) {
  if (!viewer) return false;
  return viewer.plan === "PRO" && viewer.onboarded && viewer.user.fieldId === fieldId;
}

// ---- Page guards (redirect or 404) ----

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");
  if (viewer.suspended) redirect("/signin?error=suspended");
  return viewer;
}

export async function requireOnboarded() {
  const viewer = await requireViewer();
  if (!viewer.onboarded) redirect("/onboarding");
  return viewer;
}

export async function requirePro() {
  const viewer = await requireOnboarded();
  if (viewer.plan !== "PRO") redirect("/dashboard");
  return viewer;
}

export async function requireAdmin() {
  const viewer = await getViewer();
  // 404 rather than a redirect, so the admin panel is not advertised.
  if (!viewer?.isAdmin) notFound();
  return viewer;
}

// ---- Action guards (throw; actions turn these into error messages) ----

export class AccessError extends Error {}

export async function assertViewer() {
  const viewer = await getViewer();
  if (!viewer || viewer.suspended) throw new AccessError("Please sign in again.");
  return viewer;
}

export async function assertOnboarded() {
  const viewer = await assertViewer();
  if (!viewer.onboarded) throw new AccessError("Please finish onboarding first.");
  return viewer;
}

export async function assertPro() {
  const viewer = await assertOnboarded();
  if (viewer.plan !== "PRO") throw new AccessError("This needs an active Pro membership.");
  return viewer;
}

export async function assertAdmin() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) throw new AccessError("You don't have access to this.");
  return viewer;
}

/** User ids the viewer has blocked or been blocked by; their Pro content is hidden both ways. */
export async function hiddenUserIds(userId: string) {
  const blocks = await db.userBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
}
