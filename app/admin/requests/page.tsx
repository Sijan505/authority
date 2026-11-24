import { formatDate } from "@/components/ArticleCard";
import { copy } from "@/content/copy";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { ReplyForm } from "./ReplyForm";

const order = ["NEW", "IN_PROGRESS", "DONE", "DECLINED"] as const;

/** The Request Desk inbox: open requests first, each with a reply the member sees in the app. */
export default async function AdminRequests() {
  await requireAdmin();
  const requests = await db.conciergeRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true, contact: true, field: { select: { name: true } } } } },
  });
  const sorted = [...requests].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const open = requests.filter((r) => r.status === "NEW" || r.status === "IN_PROGRESS").length;
  const label = copy.app.concierge.status;

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Request Desk</h1>
      <p className="mt-2 text-mute">
        {open} open · {requests.length} in total. Members see your reply and the status in the app.
      </p>

      {sorted.length === 0 ? (
        <p className="mt-8">No requests yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {sorted.map((r) => (
            <li key={r.id} className="card">
              <details open={r.status === "NEW"}>
                <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span>
                    <b className="font-semibold">{r.category}</b> <span className="text-mute">· {r.user.name ?? r.user.email}</span>
                  </span>
                  <span className="text-sm text-mute">
                    {label[r.status]} · {formatDate(r.createdAt)}
                  </span>
                </summary>
                <p className="mt-4 whitespace-pre-line">{r.details}</p>
                <p className="mt-2 text-sm text-mute">
                  {[r.city, r.date, r.people ? `${r.people} people` : null].filter(Boolean).join(" · ")}
                  {(r.city || r.date || r.people) && " · "}
                  {r.user.field?.name} · <a href={`mailto:${r.user.email}`} className="link">{r.user.email}</a>
                  {r.user.contact && r.user.contact !== r.user.email && <> · {r.user.contact}</>}
                </p>
                <ReplyForm id={r.id} status={r.status} reply={r.reply ?? ""} />
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
