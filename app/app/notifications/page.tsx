import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { SignInButton } from "@/components/AuthButtons";
import { PushToggle } from "@/components/PushToggle";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";

export const metadata = { title: "Notifications" };

const ago = (d: Date) => {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kathmandu" });
};

/** Recent notifications, newest first. Opening the screen marks them read. */
export default async function NotificationsPage() {
  const viewer = await getViewer();
  const t = copy.social;
  if (!viewer) {
    return (
      <main>
        <AppHeader label={t.notifications} title={t.notifications} />
        <div className="mx-auto max-w-xl px-5 pt-8">
          <SignInButton label={copy.app.guest.signIn} callbackUrl="/app/notifications" className="btn" />
        </div>
      </main>
    );
  }

  const items = await db.notification.findMany({
    where: { userId: viewer.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, image: true, photoUpdatedAt: true } } },
  });
  await db.notification.updateMany({ where: { userId: viewer.user.id, readAt: null }, data: { readAt: new Date() } });

  return (
    <main>
      <AppHeader label={t.notifications} title={t.notifications} />
      <div className="mx-auto max-w-xl px-5 pt-6 pb-10">
        {items.length === 0 ? (
          <p className="text-mute">{t.noNotifications}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.link} className={`flex items-center gap-3 py-4 ${n.readAt ? "" : "font-medium"}`}>
                  {n.actor ? (
                    <Avatar name={n.actor.name} image={photoUrl(n.actor)} size={44} />
                  ) : (
                    <span className="app-tile-art grid h-11 w-11 shrink-0 place-items-center rounded-full text-gold">✦</span>
                  )}
                  <span className="min-w-0 flex-1">{n.text}</span>
                  <span className="shrink-0 text-xs text-mute">{ago(n.createdAt)}</span>
                  {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="new" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <PushToggle />
        </div>
      </div>
    </main>
  );
}
