"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, assertPro } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { copy } from "@/content/copy";
import { conciergeReplySchema, conciergeSchema, fieldErrors, type ActionState } from "@/lib/validation";

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

    await db.conciergeRequest.create({ data: { userId: viewer.user.id, ...parsed.data } });
    revalidatePath("/app/concierge");
    revalidatePath("/admin/requests");
    return { ok: true, message: "Sent. A person on our team will reply here." };
  });
}

/** The team updates a request's status and writes the reply the member sees. */
export async function replyToRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("admin", { max: 120, windowSeconds: 600 }, async (): Promise<ActionState> => {
    const admin = await assertAdmin();
    const parsed = conciergeReplySchema.safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
      reply: formData.get("reply") ?? "",
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check the form." };
    const { id, status, reply } = parsed.data;

    const before = await db.conciergeRequest.findUnique({ where: { id }, select: { userId: true, status: true, reply: true, category: true } });
    if (!before) return { message: "This request no longer exists." };
    await db.$transaction([
      db.conciergeRequest.update({ where: { id }, data: { status, reply } }),
      audit(db, { actorId: admin.user.id, action: "concierge.reply", targetType: "concierge_request", targetId: id, details: { status } }),
    ]);
    // Tell the member when there is a new reply or the status moves on.
    if (reply !== before.reply || status !== before.status) {
      await notify(before.userId, { type: "concierge.reply", ...copy.social.notice.concierge(before.category), link: "/app/concierge#requests" });
    }
    revalidatePath("/admin/requests");
    revalidatePath("/app/concierge");
    return { ok: true, message: "Saved." };
  });
}
