"use server";

import { revalidatePath } from "next/cache";
import { copy } from "@/content/copy";
import { AccessError, assertPro, assertViewer } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { areConnected, blockedEitherWay, connectionBetween, isActiveMember } from "@/lib/social";
import { groupMessageIdSchema, groupMessageSchema, messageSchema, pushSubscriptionSchema, respondSchema, userIdSchema, type ActionState } from "@/lib/validation";

const t = copy.social;
const displayName = (name: string | null) => (name ?? "").trim() || "An Authority member";

/** Both people must be active members and must not have blocked each other. */
async function assertCanReach(viewerId: string, otherId: string) {
  if (viewerId === otherId) throw new AccessError(copy.errors.forbidden);
  if (!(await isActiveMember(otherId)) || (await blockedEitherWay(viewerId, otherId))) throw new AccessError(t.unavailable);
}

function refresh(otherId?: string) {
  revalidatePath("/app", "layout");
  if (otherId) revalidatePath(`/app/members/${otherId}`);
}

/** Send a connection request, or accept theirs if they already asked. */
export async function connect(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("connect", { max: 40, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertPro();
    const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
    if (!parsed.success) return { message: copy.errors.generic };
    const otherId = parsed.data.userId;
    await assertCanReach(viewer.user.id, otherId);

    const existing = await connectionBetween(viewer.user.id, otherId);
    const name = displayName(viewer.user.name);
    if (existing?.status === "ACCEPTED") return { ok: true };
    if (existing?.status === "PENDING" && existing.addresseeId === viewer.user.id) {
      // They asked first: connecting now accepts their request.
      await db.connection.update({ where: { id: existing.id }, data: { status: "ACCEPTED", respondedAt: new Date() } });
      await notify(otherId, { type: "connect.accepted", ...t.notice.accepted(name), link: `/app/members/${viewer.user.id}`, actorId: viewer.user.id });
    } else if (existing?.status === "PENDING") {
      return { ok: true };
    } else {
      // New request; a declined one can be asked again, by either side.
      if (existing) await db.connection.delete({ where: { id: existing.id } });
      await db.connection.create({ data: { requesterId: viewer.user.id, addresseeId: otherId } });
      await notify(otherId, { type: "connect.request", ...t.notice.request(name), link: "/app/members?tab=requests", actorId: viewer.user.id });
    }
    refresh(otherId);
    return { ok: true };
  });
}

/** Accept or decline a request someone sent the viewer. */
export async function respond(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("connect", { max: 60, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertPro();
    const parsed = respondSchema.safeParse({ connectionId: formData.get("connectionId"), decision: formData.get("decision") });
    if (!parsed.success) return { message: copy.errors.generic };
    const c = await db.connection.findUnique({ where: { id: parsed.data.connectionId } });
    if (!c || c.addresseeId !== viewer.user.id || c.status !== "PENDING") return { ok: true };

    const accept = parsed.data.decision === "accept";
    if (accept) await assertCanReach(viewer.user.id, c.requesterId);
    await db.connection.update({ where: { id: c.id }, data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } });
    // A decline is silent, as on most networks; an accept tells them.
    if (accept) {
      await notify(c.requesterId, {
        type: "connect.accepted",
        ...t.notice.accepted(displayName(viewer.user.name)),
        link: `/app/members/${viewer.user.id}`,
        actorId: viewer.user.id,
      });
    }
    refresh(c.requesterId);
    return { ok: true };
  });
}

/** Withdraw a request the viewer sent, or remove a connection. Messages already sent stay. */
export async function disconnect(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("connect", { max: 60, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertViewer();
    const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
    if (!parsed.success) return { message: copy.errors.generic };
    const c = await connectionBetween(viewer.user.id, parsed.data.userId);
    if (c && (c.status === "ACCEPTED" || c.requesterId === viewer.user.id)) await db.connection.delete({ where: { id: c.id } });
    refresh(parsed.data.userId);
    return { ok: true };
  });
}

/** Send a private message to a connected member. */
export async function sendMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("message", { max: 120, windowSeconds: 600 }, async (): Promise<ActionState> => {
    const viewer = await assertPro();
    const parsed = messageSchema.safeParse({ to: formData.get("to"), body: formData.get("body") ?? "" });
    if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? copy.errors.generic };
    const { to, body } = parsed.data;
    await assertCanReach(viewer.user.id, to);
    if (!(await areConnected(viewer.user.id, to))) throw new AccessError(t.connectFirst);

    await db.message.create({ data: { senderId: viewer.user.id, recipientId: to, body } });
    // One unread "new message" notice per conversation, not one per message.
    const already = await db.notification.findFirst({ where: { userId: to, actorId: viewer.user.id, type: "message", readAt: null } });
    if (already) await db.notification.update({ where: { id: already.id }, data: { createdAt: new Date() } });
    else await notify(to, { type: "message", ...t.notice.message(displayName(viewer.user.name)), link: `/app/messages/${viewer.user.id}`, actorId: viewer.user.id });
    revalidatePath(`/app/messages/${to}`);
    revalidatePath("/app/messages");
    return { ok: true };
  });
}

/** Post in the members' group chat. Every active member can read it. */
export async function sendGroupMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("group", { max: 60, windowSeconds: 600 }, async (): Promise<ActionState> => {
    const viewer = await assertPro();
    const parsed = groupMessageSchema.safeParse({ body: formData.get("body") ?? "" });
    if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? copy.errors.generic };
    const now = new Date();
    await db.$transaction([
      db.groupMessage.create({ data: { userId: viewer.user.id, body: parsed.data.body, createdAt: now } }),
      db.user.update({ where: { id: viewer.user.id }, data: { groupReadAt: now } }),
    ]);
    revalidatePath("/app/messages", "layout");
    return { ok: true };
  });
}

/** Remove a group message: members their own, admins any. The row stays, marked removed. */
export async function removeGroupMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("group", { max: 60, windowSeconds: 600 }, async (): Promise<ActionState> => {
    const viewer = await assertViewer();
    const parsed = groupMessageIdSchema.safeParse({ messageId: formData.get("messageId") });
    if (!parsed.success) return { message: copy.errors.generic };
    const m = await db.groupMessage.findUnique({ where: { id: parsed.data.messageId } });
    if (!m || m.removedAt) return { ok: true };
    const own = m.userId === viewer.user.id && m.kind === "message" && viewer.plan === "PRO";
    if (!own && !viewer.isAdmin) throw new AccessError(copy.errors.forbidden);
    await db.groupMessage.update({ where: { id: m.id }, data: { removedAt: new Date() } });
    if (!own) await audit(db, { actorId: viewer.user.id, action: "group.remove_message", targetType: "group_message", targetId: m.id, details: { authorId: m.userId } });
    revalidatePath("/app/messages", "layout");
    return { ok: true };
  });
}

/** Marks every notification read (when the notifications screen opens). */
export async function markNotificationsRead() {
  const viewer = await assertViewer();
  await db.notification.updateMany({ where: { userId: viewer.user.id, readAt: null }, data: { readAt: new Date() } });
}

/** Remembers this phone for push notifications. */
export async function savePushSubscription(raw: unknown): Promise<ActionState> {
  return runAction("push", { max: 20, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertViewer();
    const parsed = pushSubscriptionSchema.safeParse(raw);
    if (!parsed.success) return { message: copy.errors.generic };
    const { endpoint, keys } = parsed.data;
    await db.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: viewer.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: viewer.user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
    return { ok: true };
  });
}

/** Forgets this phone (notifications turned off). */
export async function removePushSubscription(endpoint: string): Promise<ActionState> {
  const viewer = await assertViewer();
  await db.pushSubscription.deleteMany({ where: { endpoint: String(endpoint).slice(0, 1000), userId: viewer.user.id } });
  return { ok: true };
}
