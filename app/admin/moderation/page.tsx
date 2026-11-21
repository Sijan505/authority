import { formatDate } from "@/components/ArticleCard";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { ModerationForm } from "../forms";

export default async function AdminModeration() {
  await requireAdmin();
  const [open, recent] = await Promise.all([
    db.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      include: {
        reporter: { select: { name: true, email: true } },
        comment: { include: { user: { select: { name: true, email: true } }, article: { select: { title: true, slug: true } } } },
        post: { include: { user: { select: { name: true, email: true } }, field: { select: { name: true } } } },
      },
    }),
    db.auditLog.findMany({
      where: { action: { startsWith: "moderation." } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <>
      <h1 className="text-4xl font-medium text-brown">Moderation</h1>
      <h2 className="mt-8 text-2xl font-medium text-brown">Open reports ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mt-3">No open reports.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {open.map((r) => {
            const target = r.comment ?? r.post;
            return (
              <li key={r.id} className="card space-y-2">
                <p className="text-sm">
                  {r.comment ? (
                    <>
                      Comment on <a href={`/articles/${r.comment.article.slug}`} className="link">{r.comment.article.title}</a>
                    </>
                  ) : (
                    <>Discussion post in {r.post?.field.name}</>
                  )}{" "}
                  · reported by {r.reporter.name ?? r.reporter.email} on {formatDate(r.createdAt)}
                </p>
                <p>
                  <strong className="text-brown">Reason:</strong> {r.reason}
                </p>
                {target && (
                  <blockquote className="border-l-2 border-gold pl-3 whitespace-pre-line">
                    <p className="text-sm font-semibold text-brown">{target.user.name ?? target.user.email}</p>
                    {target.removedAt ? <em>Already removed</em> : target.body}
                  </blockquote>
                )}
                <ModerationForm reportId={r.id} />
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-12 text-2xl font-medium text-brown">Recent actions</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {recent.map((a) => (
          <li key={a.id}>
            {formatDate(a.createdAt)} · {a.actor?.name ?? a.actor?.email ?? "system"} · {a.action.replace("moderation.", "")} ·{" "}
            {a.targetType}
          </li>
        ))}
      </ul>
    </>
  );
}
