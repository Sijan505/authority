"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin, assertPro } from "@/lib/access";
import { runAction } from "@/lib/action";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
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

    await db.$transaction([
      db.conciergeRequest.update({ where: { id }, data: { status, reply } }),
      audit(db, { actorId: admin.user.id, action: "concierge.reply", targetType: "concierge_request", targetId: id, details: { status } }),
    ]);
    revalidatePath("/admin/requests");
    revalidatePath("/app/concierge");
    return { ok: true, message: "Saved." };
  });
}
