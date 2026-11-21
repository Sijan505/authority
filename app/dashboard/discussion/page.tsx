import type { Metadata } from "next";
import { formatDate } from "@/components/ArticleCard";
import { BlockButton, PostForm, ReportButton } from "@/components/community";
import { copy } from "@/content/copy";
import { hiddenUserIds, requirePro } from "@/lib/access";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: copy.discussion.heading };

export default async function DiscussionPage() {
  const viewer = await requirePro();
  const t = copy.discussion;
  const fieldId = viewer.user.fieldId!;
  const hidden = await hiddenUserIds(viewer.user.id);

  // Scoped to the viewer's field, and hides members blocked either way.
  const posts = await db.discussionPost.findMany({
    where: { fieldId, parentId: null, userId: { notIn: hidden } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true } },
      replies: {
        where: { userId: { notIn: hidden } },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  type Item = (typeof posts)[number] | (typeof posts)[number]["replies"][number];
  const renderItem = (item: Item) => (
    <>
      <p className="text-sm font-semibold text-brown">
        {item.user.name} <span className="font-normal">· {formatDate(item.createdAt)}</span>
      </p>
      <p className="mt-1 whitespace-pre-line">{item.removedAt ? t.removed : item.body}</p>
      {!item.removedAt && item.user.id !== viewer.user.id && (
        <div className="mt-1 flex gap-4">
          <ReportButton targetType="post" targetId={item.id} />
          <BlockButton userId={item.user.id} />
        </div>
      )}
    </>
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium text-brown">{t.heading}</h1>
      <p className="mt-2">{t.intro}</p>

      <div className="card mt-8">
        <PostForm />
      </div>

      {posts.length === 0 ? (
        <p className="mt-10 text-center">{t.empty}</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {posts.map((p) => (
            <li key={p.id} className="border-t border-gold/30 pt-5">
              {renderItem(p)}
              {p.replies.length > 0 && (
                <ul className="mt-4 space-y-4 border-l-2 pl-4" style={{ borderColor: "var(--accent)" }}>
                  {p.replies.map((r) => (
                    <li key={r.id}>
                      {renderItem(r)}
                    </li>
                  ))}
                </ul>
              )}
              {!p.removedAt && (
                <details className="mt-3">
                  <summary className="link w-fit text-sm">{t.reply}</summary>
                  <PostForm parentId={p.id} />
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
