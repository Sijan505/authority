"use server";

import { Prisma } from "@/generated/prisma/client";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { fieldErrors, inquiryRef, inquirySchema, type ActionState } from "@/lib/validation";

export type InquiryResult = ActionState & { ref?: string; repeat?: boolean };

/**
 * Saves a "Register your interest" sign-up. Open to signed-out visitors, so it is
 * rate-limited by IP. One sign-up per email or WhatsApp number: sending again returns
 * the original reference instead of creating a duplicate.
 */
export async function submitInquiry(_prev: ActionState, formData: FormData): Promise<InquiryResult> {
  // Honeypot: a hidden field people never see. Bots that fill it get a quiet "success".
  if (String(formData.get("company") ?? "") !== "") return { ok: true };

  let ref: string | undefined;
  let repeat = false;
  const result = await runAction("inquiry", { max: 5, windowSeconds: 3600 }, async () => {
    const str = (k: string) => String(formData.get(k) ?? "");
    const parsed = inquirySchema.safeParse({
      field: str("field"),
      name: str("name"),
      city: str("city"),
      contact: str("contact"),
      perks: formData.getAll("perks").map(String),
      priceBand: str("priceBand"),
      deposit: str("deposit"),
      helpBuild: str("helpBuild"),
      contribution: formData.getAll("contribution").map(String),
      source: str("source"),
      sourceDetail: str("sourceDetail"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please check your answers." };

    const existing = await db.inquiry.findUnique({ where: { contact: parsed.data.contact }, select: { id: true } });
    if (existing) {
      ref = inquiryRef(existing.id);
      repeat = true;
      return { ok: true };
    }
    try {
      const created = await db.inquiry.create({ data: parsed.data, select: { id: true } });
      ref = inquiryRef(created.id);
    } catch (err) {
      // Two sends at once with the same contact: the unique index catches the second.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
      const row = await db.inquiry.findUnique({ where: { contact: parsed.data.contact }, select: { id: true } });
      ref = row ? inquiryRef(row.id) : undefined;
      repeat = true;
    }
    return { ok: true };
  });
  return { ...result, ref: result.ok ? ref : undefined, repeat: result.ok ? repeat : undefined };
}
