import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";

export type NotificationType = "connect.request" | "connect.accepted" | "message" | "concierge.reply";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const pushReady = Boolean(publicKey && privateKey);
if (pushReady) webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@example.com", publicKey!, privateKey!);

/**
 * Records an in-app notification and pushes it to every phone the member turned
 * notifications on for. Push failures never fail the action that caused them;
 * phones that have unsubscribed (404/410) are forgotten.
 */
export async function notify(userId: string, n: { type: NotificationType; text: string; link: string; actorId?: string | null }) {
  await db.notification.create({ data: { userId, type: n.type, text: n.text, link: n.link, actorId: n.actorId ?? null } });
  if (!pushReady) return;

  const subs = await db.pushSubscription.findMany({ where: { userId } });
  // The lock screen shows only who and what, never message text.
  const payload = JSON.stringify({ title: "Authority", body: n.text, url: n.link, tag: n.type === "message" ? `message:${n.actorId}` : n.type });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        else console.error("[push]", status ?? err);
      }
    }),
  );
}

export const pushConfigured = () => pushReady;
