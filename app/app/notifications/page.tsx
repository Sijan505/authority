import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { Star } from "@/components/Decor";
import { SignInButton } from "@/components/AuthButtons";
import { PushToggle } from "@/components/PushToggle";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";

export const metadata = { title: "Notifications" };

const isToday = (d: Date) => {
  const fmt = (x: Date) => x.toLocaleDateString("en-GB", { timeZone: "Asia/Kathmandu" });
  return fmt(d) === fmt(new Date());
};

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
          <div className="border border-line bg-paper/60 px-6 py-10 text-center">
            <p className="font-serif text-[1.25rem] font-light">{t.noNotifications}</p>
          </div>
        ) : (
          [
            { label: t.today, list: items.filter((n) => isToday(n.createdAt)) },
            { label: t.earlier, list: items.filter((n) => !isToday(n.createdAt)) },
          ]
            .filter((g) => g.list.length > 0)
            .map((g) => (
              <section key={g.label} className="mb-8">
                <h2 className="mb-2 text-[0.6875rem] font-semibold tracking-[0.24em] text-mute uppercase">{g.label}</h2>
                <ul className="overflow-hidden border border-line bg-paper/40">
                  {g.list.map((n) => (
                    <li key={n.id} className="border-b border-line last:border-b-0">
                      <Link href={n.link} className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-gold-pale/40 ${n.readAt ? "" : "bg-gold-pale/30"}`}>
                        {n.actor ? (
                          <Avatar name={n.actor.name} image={photoUrl(n.actor)} size={44} />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/50 bg-ivory">
                            <Star className="h-5 w-5 text-tika" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-[0.625rem] font-semibold tracking-[0.18em] text-tika uppercase">{t.noticeLabel[n.type] ?? "Authority"}</span>
                            <span className="shrink-0 text-xs text-mute">{ago(n.createdAt)}</span>
                          </span>
                          <span className={`mt-1 block leading-snug ${n.readAt ? "text-ink/80" : "font-medium text-ink"}`}>
                            {n.actor?.name && n.type === "message" ? <>{n.actor.name} · </> : null}
                            {n.text}
                          </span>
                        </span>
                        {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tika" aria-label="new" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
        )}
        <div className="mt-8">
          <PushToggle />
        </div>
      </div>
    </main>
  );
}
