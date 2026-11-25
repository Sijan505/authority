"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { postGroupJoin } from "@/lib/group";
import { adminMembershipSchema, adminProfileSchema, fieldErrors, userIdSchema, type ActionState } from "@/lib/validation";

// Admin → Members → one member: account settings. Every action checks the ADMIN role
// on the server and records exactly what changed in the audit log.

const LIMIT = { max: 120, windowSeconds: 600 };
const refresh = (userId: string) => {
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/app", "layout");
};

/** Name, field, city, contact, status and role. */
export async function adminUpdateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = adminProfileSchema.safeParse({
      userId: formData.get("userId"),
      name: formData.get("name") ?? "",
      fieldId: formData.get("fieldId") ?? "",
      city: formData.get("city") ?? "",
      contact: formData.get("contact") ?? "",
      status: formData.get("status"),
      role: formData.get("role"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted fields." };
    const v = parsed.data;

    const user = await db.user.findUnique({ where: { id: v.userId } });
    if (!user) return { message: "Member not found." };
    if (user.id === admin.user.id && v.status === "SUSPENDED") return { errors: { status: "You can't suspend yourself." } };
    if (user.id === admin.user.id && v.role !== "ADMIN") return { errors: { role: "You can't remove your own admin access." } };
    if (v.fieldId && !(await db.field.findUnique({ where: { id: v.fieldId }, select: { id: true } }))) return { errors: { fieldId: "Field not found." } };

    const next = { name: v.name, fieldId: v.fieldId || null, city: v.city || null, contact: v.contact, status: v.status, role: v.role };
    const before = { name: user.name, fieldId: user.fieldId, city: user.city, contact: user.contact, status: user.status, role: user.role };
    const changed = (Object.keys(next) as (keyof typeof next)[]).filter((k) => (next[k] ?? null) !== (before[k] ?? null));
    if (changed.length === 0) return { ok: true, message: "No changes." };

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: next }),
      audit(db, {
        actorId: admin.user.id,
        action: "member.update_profile",
        targetType: "user",
        targetId: user.id,
        details: Object.fromEntries(changed.map((k) => [k, { from: before[k] ?? null, to: next[k] ?? null }])),
      }),
    ]);
    refresh(user.id);
    return { ok: true, message: `Saved: ${changed.join(", ")}.` };
  });
}

/**
 * Membership: "set" makes them a member until a date (extends or shortens the current
 * membership, or starts one with no payment); "end" ends it now, including any
 * already-paid future periods.
 */
export async function adminSetMembership(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = adminMembershipSchema.safeParse({ userId: formData.get("userId"), mode: formData.get("mode"), until: formData.get("until") ?? "" });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the date." };
    const { userId, mode, until } = parsed.data;
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { message: "Member not found." };
    const now = new Date();

    const result = await db.$transaction(async (tx) => {
      const live = await tx.subscription.findMany({
        where: { userId, package: "PRO", status: "ACTIVE", expiresAt: { gt: now } },
        orderBy: { expiresAt: "desc" },
      });
      if (mode === "end") {
        if (!live.length) return "Not a member, nothing to end.";
        await tx.subscription.updateMany({ where: { id: { in: live.map((s) => s.id) } }, data: { status: "CANCELLED" } });
        await audit(tx, { actorId: admin.user.id, action: "member.end_membership", targetType: "user", targetId: userId, details: { cancelled: live.map((s) => s.id) } });
        return "Membership ended.";
      }
      const current = live.find((s) => s.startsAt && s.startsAt <= now);
      if (current) {
        // Move the end of the current period; drop any later periods so the new date is the end.
        const later = live.filter((s) => s.id !== current.id);
        await tx.subscription.update({ where: { id: current.id }, data: { expiresAt: until! } });
        if (later.length) await tx.subscription.updateMany({ where: { id: { in: later.map((s) => s.id) } }, data: { status: "CANCELLED" } });
        await audit(tx, {
          actorId: admin.user.id,
          action: "member.change_membership_end",
          targetType: "user",
          targetId: userId,
          details: { from: live[0].expiresAt?.toISOString() ?? null, to: until!.toISOString(), cancelledLater: later.map((s) => s.id) },
        });
        return "Membership end date changed.";
      }
      // Not a member right now: start a membership with no payment attached.
      const days = (until!.getTime() - now.getTime()) / 86_400_000;
      const created = await tx.subscription.create({
        data: { userId, package: "PRO", billingCycle: days > 60 ? "YEARLY" : "MONTHLY", status: "ACTIVE", startsAt: now, expiresAt: until! },
      });
      await audit(tx, {
        actorId: admin.user.id,
        action: "member.grant_membership",
        targetType: "user",
        targetId: userId,
        details: { subscriptionId: created.id, until: until!.toISOString(), payment: "none (given by admin)" },
      });
      await postGroupJoin(tx, userId, created.id);
      return "Membership started.";
    });
    refresh(userId);
    return { ok: true, message: result };
  });
}

/** Removes the member's uploaded photo (their Google photo shows again). */
export async function adminRemovePhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
    if (!parsed.success) return { message: "Invalid request." };
    await db.user.update({ where: { id: parsed.data.userId }, data: { photo: null, photoUpdatedAt: null } });
    await audit(db, { actorId: admin.user.id, action: "member.remove_photo", targetType: "user", targetId: parsed.data.userId });
    refresh(parsed.data.userId);
    return { ok: true, message: "Photo removed." };
  });
}

/** Issues a new card QR code; the old one stops working (e.g. a lost or shared phone). */
export async function adminResetCardCode(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
    if (!parsed.success) return { message: "Invalid request." };
    // Cleared now; a new code is created the next time their card is shown.
    await db.user.update({ where: { id: parsed.data.userId }, data: { memberCode: null } });
    await audit(db, { actorId: admin.user.id, action: "member.reset_card_code", targetType: "user", targetId: parsed.data.userId });
    refresh(parsed.data.userId);
    return { ok: true, message: "Card QR code reset. The old QR no longer works." };
  });
}
