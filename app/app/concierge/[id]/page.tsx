import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LOGO_PATH } from "@/components/Decor";
import { LiveRefresh, ScrollToEnd } from "@/components/social";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { ConciergeComposer } from "./Composer";

export const metadata = { title: "Request Desk" };

const when = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kathmandu" });

const tone: Record<string, string> = {
  NEW: "border-ink/30 text-mute",
  IN_PROGRESS: "border-tika text-tika",
  DONE: "border-ink bg-ink text-ivory",
  DECLINED: "border-ink/30 text-mute",
};

/** One Request Desk request as a conversation between the member and the team. */
export default async function ConciergeThread({ params }: PageProps<"/app/concierge/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/app/concierge");
  const t = copy.app.concierge;

  const request = await db.conciergeRequest.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!request || request.userId !== viewer.user.id) notFound();

  // Opening the conversation clears its unread mark and its notifications.
  if (request.memberUnread) await db.conciergeRequest.update({ where: { id }, data: { memberUnread: false } });
  await db.notification.updateMany({ where: { userId: viewer.user.id, link: `/app/concierge/${id}`, readAt: null }, data: { readAt: new Date() } });

  const meta = [request.city, request.date, request.people ? `${request.people} ${request.people === 1 ? "person" : "people"}` : null].filter(Boolean).join(" · ");

  return (
    <main className="pb-24">
      <LiveRefresh every={6000} />
      <header className="app-header sticky top-0 z-20 border-b border-line px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 text-ink">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/app/concierge" aria-label={t.eyebrow} className="grid h-11 w-11 place-items-center text-xl">
            ‹
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[0.625rem] tracking-[0.24em] text-mute uppercase">{t.eyebrow}</p>
            <p className="truncate font-serif text-[1.125rem]">{request.category}</p>
          </div>
          <span className={`shrink-0 border px-2 py-0.5 text-[0.6875rem] tracking-[0.1em] uppercase ${tone[request.status]}`}>{t.status[request.status]}</span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-4">
        <ol className="space-y-3">
          {/* The original request opens the conversation. */}
          <li className="flex justify-end">
            <div className="max-w-[85%] bg-ink px-4 py-3 text-ivory">
              <p className="text-[0.625rem] tracking-[0.2em] uppercase opacity-60">{t.yourRequest}</p>
              <p className="mt-1 break-words whitespace-pre-line">{request.details}</p>
              {meta && <p className="mt-2 text-xs opacity-70">{meta}</p>}
              <p className="mt-1 text-right text-[0.625rem] opacity-55">{when(request.createdAt)}</p>
            </div>
          </li>
          {request.messages.map((m) => (
            <li key={m.id} className={`flex ${m.fromTeam ? "justify-start" : "justify-end"}`}>
              {m.fromTeam ? (
                <div className="flex max-w-[85%] gap-2">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/60 bg-ivory">
                    <svg viewBox="0 0 48 48" className="h-4 w-4 text-tika" fill="none" aria-hidden="true">
                      <path d={LOGO_PATH} stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div className="border border-gold/40 bg-gold-pale/30 px-4 py-3">
                    <p className="text-[0.625rem] font-semibold tracking-[0.2em] text-tika uppercase">{t.team}</p>
                    <p className="mt-1 break-words whitespace-pre-line">{m.body}</p>
                    <p className="mt-1 text-right text-[0.625rem] text-mute">
                      {when(m.createdAt)}
                      {m.editedAt && ` · ${t.edited}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] bg-ink px-4 py-3 text-ivory">
                  <p className="break-words whitespace-pre-line">{m.body}</p>
                  <p className="mt-1 text-right text-[0.625rem] opacity-55">
                    {when(m.createdAt)}
                    {m.editedAt && ` · ${t.edited}`}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
        {request.messages.length === 0 && <p className="mt-6 text-center text-sm text-mute">{t.waiting}</p>}
        <ScrollToEnd count={request.messages.length} />
      </div>

      {request.repliesLocked ? (
        <p className="app-composer fixed inset-x-0 z-30 border-t border-line bg-ivory px-4 py-4 text-center text-sm text-mute">{t.lockedReplies}</p>
      ) : (
        <ConciergeComposer requestId={request.id} />
      )}
    </main>
  );
}
