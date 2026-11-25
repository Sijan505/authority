import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { MembersLocked } from "@/components/MembersLocked";
import { LiveRefresh, MessageComposer, MessageMenu, ScrollToEnd } from "@/components/social";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { photoUrl } from "@/lib/photo";
import { blockedIds } from "@/lib/social";

export const metadata = { title: "Members' group" };

const time = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kathmandu" });
const day = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kathmandu" });

/**
 * The group chat every active member is in. New members appear here with a join
 * notice when their first membership is activated (lib/group.ts). Messages from
 * people the viewer blocked, or who blocked them, are left out; join notices stay.
 */
export default async function GroupChatPage() {
  const viewer = await getViewer();
  const t = copy.group;
  if (viewer?.plan !== "PRO") {
    return (
      <main>
        <AppHeader label={copy.social.messages} title={t.name} />
        <MembersLocked signedIn={!!viewer} callbackUrl="/app/messages/group" />
      </main>
    );
  }
  const me = viewer.user.id;
  const hidden = await blockedIds(me);
  const recent = await db.groupMessage.findMany({
    where: { OR: [{ kind: "join" }, { userId: { notIn: hidden } }] },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { user: { select: { id: true, name: true, image: true, photoUpdatedAt: true, field: { select: { name: true } } } } },
  });
  const messages = recent.reverse();

  // Opening the group clears its unread count.
  await db.user.update({ where: { id: me }, data: { groupReadAt: new Date() } });

  return (
    <main className="pb-24">
      <LiveRefresh />
      <header className="app-header sticky top-0 z-20 border-b border-line px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 text-ink">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/app/messages" aria-label={copy.social.messages} className="grid h-11 w-11 place-items-center text-xl">
            ‹
          </Link>
          <Avatar name="A" image={null} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-serif text-[1.125rem]">{t.name}</span>
            <span className="block truncate text-xs text-mute">{t.intro}</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-4">
        <p className="mb-4 text-center text-xs text-mute">{t.privacy}</p>
        {messages.length === 0 && <p className="py-10 text-center text-mute">{t.empty}</p>}
        <ol className="space-y-2">
          {messages.map((m, i) => {
            const mine = m.userId === me;
            const newDay = i === 0 || day(messages[i - 1].createdAt) !== day(m.createdAt);
            // Consecutive messages from one person show their name and photo once.
            const prev = messages[i - 1];
            const sameAuthor = !newDay && prev?.kind === "message" && prev.userId === m.userId;
            return (
              <li key={m.id}>
                {newDay && <p className="my-4 text-center text-[0.6875rem] tracking-[0.18em] text-mute uppercase">{day(m.createdAt)}</p>}
                {m.kind === "join" ? (
                  <div className="my-3 flex justify-center">
                    <Link
                      href={`/app/members/${m.userId}`}
                      className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold-pale/30 py-1.5 pr-4 pl-1.5 text-sm text-ink"
                    >
                      <Avatar name={m.user.name} image={photoUrl(m.user)} size={26} />
                      <span>{m.removedAt ? t.removed : m.body}</span>
                    </Link>
                  </div>
                ) : (
                  <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${sameAuthor ? "" : "mt-3"}`}>
                    {!mine && (
                      <span className="w-8 shrink-0">
                        {!sameAuthor && (
                          <Link href={`/app/members/${m.userId}`} aria-label={m.user.name ?? ""}>
                            <Avatar name={m.user.name} image={photoUrl(m.user)} size={32} />
                          </Link>
                        )}
                      </span>
                    )}
                    <MessageMenu
                      kind="group"
                      messageId={m.id}
                      body={m.body}
                      sentAt={m.createdAt.toISOString()}
                      mine={mine && !m.removedAt}
                      canRemove={viewer.isAdmin && !m.removedAt}
                      className="max-w-[78%]"
                    >
                      <div className={`px-4 py-2.5 ${mine ? "bg-ink text-ivory" : "border border-line bg-paper/70"} ${m.removedAt ? "opacity-60" : ""}`}>
                        {!mine && !sameAuthor && (
                          <p className="mb-0.5 text-xs">
                            <span className="font-medium">{m.user.name}</span>
                            {m.user.field && <span className="text-mute"> · {m.user.field.name}</span>}
                          </p>
                        )}
                        <p className={`break-words whitespace-pre-line ${m.removedAt ? "italic" : ""}`}>{m.removedAt ? t.removed : m.body}</p>
                        <p className={`mt-1 text-right text-[0.625rem] ${mine ? "text-ivory/55" : "text-mute"}`}>
                          {m.editedAt && !m.removedAt && `${copy.social.edited} · `}
                          {time(m.createdAt)}
                        </p>
                      </div>
                    </MessageMenu>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <ScrollToEnd count={messages.length} />
      </div>

      <MessageComposer />
    </main>
  );
}
