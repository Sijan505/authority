import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { MembersLocked } from "@/components/MembersLocked";
import { LiveRefresh, MessageComposer, ScrollToEnd } from "@/components/social";
import { AppHeader } from "@/components/AppHeader";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { activeMemberWhere, areConnected, blockedEitherWay } from "@/lib/social";

export const metadata = { title: "Conversation" };

const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kathmandu" });
const day = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kathmandu" });

/** A private conversation with one connected member. Opening it marks their messages read. */
export default async function ConversationPage({ params }: PageProps<"/app/messages/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  const t = copy.social;
  if (viewer?.plan !== "PRO") {
    return (
      <main>
        <AppHeader label={t.messages} />
        <MembersLocked signedIn={!!viewer} callbackUrl={`/app/messages/${id}`} />
      </main>
    );
  }
  const me = viewer.user.id;
  const [person, connected, blocked] = await Promise.all([
    db.user.findFirst({ where: { id, ...activeMemberWhere() }, select: { id: true, name: true, image: true, photoUpdatedAt: true, field: { select: { name: true } } } }),
    areConnected(me, id),
    blockedEitherWay(me, id),
  ]);
  if (!person || blocked || id === me) notFound();

  const recent = await db.message.findMany({
    where: { OR: [{ senderId: me, recipientId: id }, { senderId: id, recipientId: me }] },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const messages = recent.reverse();

  // Reading the conversation clears its unread messages and its notification.
  await Promise.all([
    db.message.updateMany({ where: { senderId: id, recipientId: me, readAt: null }, data: { readAt: new Date() } }),
    db.notification.updateMany({ where: { userId: me, actorId: id, type: "message", readAt: null }, data: { readAt: new Date() } }),
  ]);

  return (
    <main className="pb-24">
      <LiveRefresh />
      <header className="app-header sticky top-0 z-20 border-b border-line px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 text-ink">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/app/messages" aria-label={t.messages} className="grid h-11 w-11 place-items-center text-xl">
            ‹
          </Link>
          <Link href={`/app/members/${person.id}`} className="flex min-w-0 items-center gap-3">
            <Avatar name={person.name} image={photoUrl(person)} size={40} />
            <span className="min-w-0">
              <span className="block truncate font-serif text-[1.125rem]">{person.name}</span>
              <span className="block truncate text-xs text-mute">{person.field?.name}</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-4">
        <p className="mb-4 text-center text-xs text-mute">{t.privacy}</p>
        <ol className="space-y-2">
          {messages.map((m, i) => {
            const mine = m.senderId === me;
            const newDay = i === 0 || day(messages[i - 1].createdAt) !== day(m.createdAt);
            return (
              <li key={m.id}>
                {newDay && <p className="my-4 text-center text-[0.6875rem] tracking-[0.18em] text-mute uppercase">{day(m.createdAt)}</p>}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 ${mine ? "bg-ink text-ivory" : "border border-line bg-paper/70"}`}>
                    <p className="break-words whitespace-pre-line">{m.body}</p>
                    <p className={`mt-1 text-right text-[0.625rem] ${mine ? "text-ivory/55" : "text-mute"}`}>
                      {time(m.createdAt)}
                      {mine && m.readAt && " · ✓✓"}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <ScrollToEnd count={messages.length} />
      </div>

      {connected ? (
        <MessageComposer to={person.id} />
      ) : (
        <div className="app-composer fixed inset-x-0 z-30 border-t border-line bg-ivory px-4 py-4 text-center text-sm text-mute">
          {t.connectFirst}{" "}
          <Link href={`/app/members/${person.id}`} className="link">
            {person.name}
          </Link>
        </div>
      )}
    </main>
  );
}
