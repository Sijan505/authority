"use server";

import { revalidatePath } from "next/cache";
import { copy } from "@/content/copy";
import { assertViewer } from "@/lib/access";
import { runAction } from "@/lib/action";
import { db } from "@/lib/db";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@/lib/photo";
import type { ActionState } from "@/lib/validation";

const t = copy.app.photo;

/** True if the bytes really are a JPEG, PNG or WebP image (not just labelled as one). */
function looksLikeImage(b: Buffer) {
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}

/** Saves the member's photo. The phone has already cropped and shrunk it to a small JPEG. */
export async function uploadPhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("photo", { max: 20, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertViewer();
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) return { message: t.choose };
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) return { message: t.invalid };
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!looksLikeImage(bytes)) return { message: t.invalid };

    await db.user.update({ where: { id: viewer.user.id }, data: { photo: bytes, photoUpdatedAt: new Date() } });
    revalidatePath("/app", "layout");
    return { ok: true, message: t.saved };
  });
}

/** Removes the uploaded photo; the Google photo (or initial) shows again. */
export async function removePhoto(): Promise<ActionState> {
  return runAction("photo", { max: 20, windowSeconds: 3600 }, async (): Promise<ActionState> => {
    const viewer = await assertViewer();
    await db.user.update({ where: { id: viewer.user.id }, data: { photo: null, photoUpdatedAt: null } });
    revalidatePath("/app", "layout");
    return { ok: true, message: t.removed };
  });
}
