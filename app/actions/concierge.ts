"use server";

import { revalidatePath } from "next/cache";
import { copy } from "@/content/copy";
import { AccessError, assertAdmin, assertPro, assertViewer } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  conciergeEditSchema,
  conciergeMemberReplySchema,
  conciergeMessageEditSchema,
  conciergeReplySchema,
  conciergeSchema,
  fieldErrors,
  type ActionState,
} from "@/lib/validation";

const refresh = (requestId?: string) => {
  revalidatePath("/app/concierge");
  if (requestId) revalidatePath(`/app/concierge/${requestId}`);
  revalidatePath("/admin/requests");
};

/** A member sends a request to the Request Desk. Members only. */
export async function submitRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("concierge", { max: 10, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertPro();
    const parsed = conciergeSchema.safeParse({
      category: formData.get("category"),
      details: formData.get("details") ?? "",
      city: formData.get("city") ?? "",
      date: formData.get("date") ?? "",
      people: formData.get("people") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the highlighted answers." };

    const created = await db.conciergeRequest.create({ data: { userId: viewer.user.id, ...parsed.data }, select: { id: true } });
    await notifyAdmins(viewer.user.id, `New ${parsed.data.category.toLowerCase()} request from ${viewer.user.name ?? "a member"}.`, created.id);
    refresh();
    return { ok: true, message: "Sent. A person on our team will reply here." };
  });
}

/** The member writes back on one of their own requests. */
export async function replyAsMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("concierge-reply", { max: 60, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertViewer();
    const parsed = conciergeMemberReplySchema.safeParse({ requestId: formData.get("requestId"), body: formData.get("body") ?? "" });
    if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? copy.errors.generic };
    const { requestId, body } = parsed.data;

    const request = await db.conciergeRequest.findUnique({ where: { id: requestId }, select: { userId: true, category: true, status: true, repliesLocked: true } });
    if (!request || request.userId !== viewer.user.id) throw new AccessError(copy.errors.forbidden);
    if (request.repliesLocked) return { message: copy.app.concierge.lockedReplies };

    await db.$transaction([
      db.conciergeMessage.create({ data: { requestId, fromTeam: false, authorId: viewer.user.id, body } }),
      // A reply on a finished request puts it back in the team's hands.
      db.conciergeRequest.update({
        where: { id: requestId },
        data: { needsTeam: true, memberUnread: false, ...(request.status === "DONE" || request.status === "DECLINED" ? { status: "IN_PROGRESS" as const } : {}) },
      }),
    ]);
    await notifyAdmins(viewer.user.id, copy.social.notice.memberReply(viewer.user.name ?? "A member", request.category).text, requestId);
    refresh(requestId);
    return { ok: true };
  });
}

/** The team sets the status and, optionally, writes a message the member sees in the app. */
export async function replyToRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", { max: 120, windowSeconds: 600 }, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = conciergeReplySchema.safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
      message: formData.get("message") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the form." };
    const { id, status, message } = parsed.data;

    const before = await db.conciergeRequest.findUnique({ where: { id }, select: { userId: true, status: true, category: true } });
    if (!before) return { message: "This request no longer exists." };
    if (!message && status === before.status) return { ok: true, message: "No changes." };

    await db.$transaction([
      ...(message ? [db.conciergeMessage.create({ data: { requestId: id, fromTeam: true, authorId: admin.user.id, body: message } })] : []),
      db.conciergeRequest.update({ where: { id }, data: { status, ...(message ? { needsTeam: false, memberUnread: true } : {}) } }),
      audit(db, { actorId: admin.user.id, action: "concierge.reply", targetType: "concierge_request", targetId: id, details: { status, wroteMessage: Boolean(message) } }),
    ]);

    const label = copy.app.concierge.status[status] ?? status;
    await notify(before.userId, {
      type: "concierge.reply",
      ...(message ? copy.social.notice.concierge(before.category) : copy.social.notice.conciergeStatus(before.category, label)),
      link: `/app/concierge/${id}`,
    });
    refresh(id);
    return { ok: true, message: message ? "Reply sent." : "Status updated." };
  });
}

/** Every active admin hears about new requests and member replies. */
async function notifyAdmins(actorId: string, text: string, requestId: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE", id: { not: actorId } }, select: { id: true } });
  await Promise.all(admins.map((a) => notify(a.id, { type: "concierge.member_reply", title: "Request Desk", text, link: `/admin/requests#r-${requestId}`, actorId })));
}

// ---- Admin: edit and delete on the Request Desk ----

const ADMIN_LIMIT = { max: 200, windowSeconds: 600 };

/** Edit a request's topic, details, city, date or number of people. */
export async function adminEditRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", ADMIN_LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = conciergeEditSchema.safeParse({
      id: formData.get("id"),
      category: formData.get("category"),
      details: formData.get("details") ?? "",
      city: formData.get("city") ?? "",
      date: formData.get("date") ?? "",
      people: formData.get("people") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the form." };
    const { id, ...data } = parsed.data;
    const before = await db.conciergeRequest.findUnique({ where: { id }, select: { category: true, details: true, city: true, date: true, people: true } });
    if (!before) return { message: "This request no longer exists." };
    await db.$transaction([
      db.conciergeRequest.update({ where: { id }, data }),
      audit(db, { actorId: admin.user.id, action: "concierge.edit_request", targetType: "concierge_request", targetId: id, details: { before, after: data } }),
    ]);
    refresh(id);
    return { ok: true, message: "Request updated." };
  });
}

/** Delete a request and its whole conversation. */
export async function adminDeleteRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", ADMIN_LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const id = String(formData.get("id") ?? "");
    const request = await db.conciergeRequest.findUnique({ where: { id }, select: { userId: true, category: true, details: true } });
    if (!request) return { ok: true };
    await db.$transaction([
      db.conciergeRequest.delete({ where: { id } }),
      db.notification.deleteMany({ where: { link: { in: [`/app/concierge/${id}`, `/admin/requests#r-${id}`] } } }),
      audit(db, { actorId: admin.user.id, action: "concierge.delete_request", targetType: "concierge_request", targetId: id, details: request }),
    ]);
    refresh(id);
    return { ok: true, message: "Request deleted." };
  });
}

/** Lock or unlock member replies on a request. */
export async function adminSetRepliesLocked(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", ADMIN_LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const id = String(formData.get("id") ?? "");
    const locked = formData.get("locked") === "1";
    const found = await db.conciergeRequest.findUnique({ where: { id }, select: { id: true } });
    if (!found) return { message: "This request no longer exists." };
    await db.$transaction([
      db.conciergeRequest.update({ where: { id }, data: { repliesLocked: locked, ...(locked ? { needsTeam: false } : {}) } }),
      audit(db, { actorId: admin.user.id, action: locked ? "concierge.lock_replies" : "concierge.unlock_replies", targetType: "concierge_request", targetId: id }),
    ]);
    refresh(id);
    return { ok: true, message: locked ? "Replies locked." : "Replies unlocked." };
  });
}

/** Edit any message in a conversation (the member's or the team's). */
export async function adminEditMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", ADMIN_LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = conciergeMessageEditSchema.safeParse({ messageId: formData.get("messageId"), body: formData.get("body") ?? "" });
    if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "Please check the message." };
    const { messageId, body } = parsed.data;
    const before = await db.conciergeMessage.findUnique({ where: { id: messageId }, select: { requestId: true, body: true } });
    if (!before) return { message: "This message no longer exists." };
    if (before.body === body) return { ok: true, message: "No changes." };
    await db.$transaction([
      db.conciergeMessage.update({ where: { id: messageId }, data: { body, editedAt: new Date() } }),
      audit(db, { actorId: admin.user.id, action: "concierge.edit_message", targetType: "concierge_message", targetId: messageId, details: { from: before.body, to: body } }),
    ]);
    refresh(before.requestId);
    return { ok: true, message: "Message updated." };
  });
}

/** Delete one message from a conversation. */
export async function adminDeleteMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", ADMIN_LIMIT, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const messageId = String(formData.get("messageId") ?? "");
    const message = await db.conciergeMessage.findUnique({ where: { id: messageId }, select: { requestId: true, body: true, fromTeam: true } });
    if (!message) return { ok: true };
    await db.$transaction([
      db.conciergeMessage.delete({ where: { id: messageId } }),
      audit(db, { actorId: admin.user.id, action: "concierge.delete_message", targetType: "concierge_message", targetId: messageId, details: message }),
    ]);
    refresh(message.requestId);
    return { ok: true, message: "Message deleted." };
  });
}
