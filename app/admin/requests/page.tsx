import { formatDate } from "@/components/ArticleCard";
import { copy } from "@/content/copy";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { DeleteRequestButton, EditRequestForm, LockButton, MessageItem, ReplyForm } from "./ReplyForm";

export const metadata = { title: "Request Desk" };

const when = (d: Date) => d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kathmandu" });

/**
 * The Request Desk inbox. Each request is a conversation with the member: reply and
 * set the status, edit or delete any message, edit or delete the request, or lock
 * further member replies. Requests waiting on the team come first. Admin only.
 */
export default async function AdminRequests() {
  await requireAdmin();
  const requests = await db.conciergeRequest.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true, contact: true, field: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  const rank = (r: (typeof requests)[number]) => (r.needsTeam && !r.repliesLocked ? 0 : r.status === "NEW" || r.status === "IN_PROGRESS" ? 1 : 2);
  const sorted = [...requests].sort((a, b) => rank(a) - rank(b));
  const waiting = requests.filter((r) => rank(r) === 0).length;
  const label = copy.app.concierge.status;

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Request Desk</h1>
      <p className="mt-2 text-mute">
        {waiting} waiting for a reply · {requests.length} in total. Members see your replies and the status in the app, and can reply back unless you lock replies.
      </p>

      {sorted.length === 0 ? (
        <p className="mt-8">No requests yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {sorted.map((r) => (
            <li key={r.id} id={`r-${r.id}`} className={`card scroll-mt-24 ${rank(r) === 0 ? "border-2 border-gold" : ""}`}>
              <details open={rank(r) === 0}>
                <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span>
                    <b className="font-semibold">{r.category}</b> <span className="text-mute">· {r.user.name ?? r.user.email}</span>
                    {rank(r) === 0 && <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-xs text-brown">{r.messages.length ? "Member replied" : "New"}</span>}
                    {r.repliesLocked && <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-mute">Replies locked</span>}
                  </span>
                  <span className="text-sm text-mute">
                    {label[r.status]} · {formatDate(r.updatedAt)}
                  </span>
                </summary>

                <p className="mt-3 text-sm text-mute">
                  {r.user.field?.name ?? "No field"} · <a href={`mailto:${r.user.email}`} className="link">{r.user.email}</a>
                  {r.user.contact && r.user.contact !== r.user.email && <> · {r.user.contact}</>}
                </p>

                <div className="mt-4 border-l-2 border-ink py-2 pl-3">
                  <p className="text-xs text-mute">
                    Request · {when(r.createdAt)}
                    {[r.city, r.date, r.people ? `${r.people} people` : null].filter(Boolean).length > 0 && <> · {[r.city, r.date, r.people ? `${r.people} people` : null].filter(Boolean).join(" · ")}</>}
                  </p>
                  <p className="mt-1 whitespace-pre-line">{r.details}</p>
                  <details className="mt-1">
                    <summary className="link cursor-pointer text-sm">Edit request</summary>
                    <EditRequestForm request={{ id: r.id, category: r.category, details: r.details, city: r.city, date: r.date, people: r.people }} />
                  </details>
                </div>

                {r.messages.length > 0 && (
                  <ol className="mt-3 space-y-2">
                    {r.messages.map((m) => (
                      <MessageItem key={m.id} message={{ id: m.id, body: m.body, fromTeam: m.fromTeam, when: when(m.createdAt), edited: !!m.editedAt }} />
                    ))}
                  </ol>
                )}

                <ReplyForm id={r.id} status={r.status} />

                <div className="mt-4 flex flex-wrap gap-3 border-t border-gold/30 pt-4">
                  <LockButton id={r.id} locked={r.repliesLocked} />
                  <DeleteRequestButton id={r.id} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
