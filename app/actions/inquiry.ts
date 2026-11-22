"use server";

import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { fieldErrors, inquiryRef, inquirySchema, type ActionState } from "@/lib/validation";

/** Saves a "Request an invitation" inquiry. Open to signed-out visitors, so it is rate-limited by IP. */
export async function submitInquiry(_prev: ActionState, formData: FormData): Promise<ActionState & { ref?: string }> {
  // Honeypot: a hidden field people never see. Bots that fill it get a quiet "success".
  if (String(formData.get("company") ?? "") !== "") return { ok: true };

  let ref: string | undefined;
  const result = await runAction("inquiry", { max: 5, windowSeconds: 3600 }, async () => {
    const str = (k: string) => String(formData.get(k) ?? "");
    const parsed = inquirySchema.safeParse({
      name: str("name"),
      email: str("email"),
      whatsapp: str("whatsapp"),
      world: str("world"),
      role: str("role"),
      city: str("city"),
      building: str("building"),
      link: str("link"),
      interests: formData.getAll("interests").map(String),
      bring: str("bring"),
      referrer: str("referrer"),
      notes: str("notes"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check your answers." };

    const created = await db.inquiry.create({ data: parsed.data, select: { id: true } });
    ref = inquiryRef(created.id);
    return { ok: true };
  });
  return { ...result, ref: result.ok ? ref : undefined };
}
