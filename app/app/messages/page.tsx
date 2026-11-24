import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { MembersLocked } from "@/components/MembersLocked";
import { LiveRefresh } from "@/components/social";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { activeMemberWhere, blockedIds } from "@/lib/social";

export const metadata = { title: "Messages" };

const when = (d: Date) => {
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kathmandu" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kathmandu" });
};

/** Conversations with connected members, latest first, with unread counts. */
export default async function MessagesPage() {
  const viewer = await getViewer();
  const t = copy.social;
  if (viewer?.plan !== "PRO") {
    return (
      <main>
        <AppHeader label={t.messages} title={t.messages} />
        <MembersLocked signedIn={!!viewer} callbackUrl="/app/messages" />
      </main>
    );
  }
  const me = viewer.user.id;
  const hidden = await blockedIds(me);
  const connections = await db.connection.findMany({ where: { status: "ACCEPTED", OR: [{ requesterId: me }, { addresseeId: me }] } });
  const ids = connections.map((c) => (c.requesterId === me ? c.addresseeId : c.requesterId)).filter((id) => !hidden.includes(id));

  const [people, unread] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids }, ...activeMemberWhere() }, select: { id: true, name: true, image: true, photoUpdatedAt: true, field: { select: { name: true } } } }),
    db.message.groupBy({ by: ["senderId"], where: { recipientId: me, readAt: null, senderId: { in: ids } }, _count: { _all: true } }),
  ]);
  const unreadBy = new Map(unread.map((u) => [u.senderId, u._count._all]));
  const last = await Promise.all(
    people.map((p) =>
      db.message.findFirst({
        where: { OR: [{ senderId: me, recipientId: p.id }, { senderId: p.id, recipientId: me }] },
        orderBy: { createdAt: "desc" },
        select: { body: true, createdAt: true, senderId: true },
      }),
    ),
  );
  const rows = people
    .map((p, i) => ({ ...p, last: last[i] }))
    .sort((a, b) => (b.last?.createdAt.getTime() ?? 0) - (a.last?.createdAt.getTime() ?? 0));

  return (
    <main>
      <LiveRefresh every={8000} />
      <AppHeader label={t.messages} title={t.messages}>
        <p className="mt-2 text-sm text-mute">{t.messagesIntro}</p>
      </AppHeader>
      <div className="mx-auto max-w-xl px-5 pt-6 pb-10">
        {rows.length === 0 ? (
          <div>
            <p className="text-mute">{t.noMessages}</p>
            <Link href="/app/members" className="btn mt-5">
              {t.findMembers}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((p) => {
              const n = unreadBy.get(p.id) ?? 0;
              return (
                <li key={p.id}>
                  <Link href={`/app/messages/${p.id}`} className="flex items-center gap-3 py-4">
                    <Avatar name={p.name} image={photoUrl(p)} size={52} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate font-serif text-[1.125rem] ${n ? "font-normal" : "font-light"}`}>{p.name}</span>
                        {p.last && <span className="shrink-0 text-xs text-mute">{when(p.last.createdAt)}</span>}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${n ? "text-ink" : "text-mute"}`}>
                          {p.last ? `${p.last.senderId === me ? `${t.you}: ` : ""}${p.last.body}` : p.field?.name}
                        </span>
                        {n > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-gold px-1.5 text-[0.6875rem] font-semibold text-ink">{n}</span>}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
