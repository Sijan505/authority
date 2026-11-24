import "server-only";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import type { Viewer } from "@/lib/access";
import { memberNumber } from "@/lib/app";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { siteUrl } from "@/lib/site-url";

/** The member's secret card code, created the first time their card is shown. */
export async function ensureMemberCode(userId: string, existing: string | null) {
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(12).toString("base64url"); // 16 characters, unguessable
    try {
      await db.user.update({ where: { id: userId }, data: { memberCode: code } });
      return code;
    } catch {
      // A collision on the unique index is practically impossible; try again anyway.
    }
  }
  throw new Error("Could not create a membership code.");
}

export const verifyUrl = (code: string) => `${siteUrl()}/verify/${code}`;

/** The QR as inline SVG markup in the brand brown, transparent background. */
export function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#3b1a12", light: "#0000" } });
}

export type CardData = {
  name: string;
  photo: string | null;
  member: boolean;
  number: number | null;
  validUntil: Date | null;
  qr: string | null; // SVG markup, only for active members
};

/** Everything the membership card shows for this viewer. */
export async function cardFor(viewer: Viewer | null): Promise<CardData | null> {
  if (!viewer) return null;
  const member = viewer.plan === "PRO";
  const number = await memberNumber(viewer);
  let qr: string | null = null;
  if (member) qr = await qrSvg(verifyUrl(await ensureMemberCode(viewer.user.id, viewer.user.memberCode)));
  return { name: viewer.user.name ?? "", photo: photoUrl(viewer.user), member, number, validUntil: viewer.proExpiresAt, qr };
}
