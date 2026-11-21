import Link from "next/link";
import { setArticleStatus } from "@/app/actions/admin";
import { formatDate } from "@/components/ArticleCard";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";

export default async function AdminArticles() {
  await requireAdmin();
  const articles = await db.article.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, status: true, publishedAt: true, tags: true, field: { select: { name: true } } },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">Articles</h1>
        <Link href="/admin/articles/new" className="btn btn-sm">
          New article
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto">
        <table className="table-admin">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Field</th>
              <th scope="col">Status</th>
              <th scope="col">Published</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/articles/${a.id}`} className="link">
                    {a.title}
                  </Link>
                  {a.tags.length > 0 && <p className="text-sm">{a.tags.join(", ")}</p>}
                </td>
                <td>{a.field.name}</td>
                <td>{a.status === "PUBLISHED" ? "Published" : "Draft"}</td>
                <td>{formatDate(a.publishedAt)}</td>
                <td className="whitespace-nowrap">
                  <form action={setArticleStatus} className="inline">
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="publish" value={a.status === "PUBLISHED" ? "0" : "1"} />
                    <button type="submit" className="btn-ghost">
                      {a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>{" "}
                  <Link href={`/articles/${a.slug}`} className="link text-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
