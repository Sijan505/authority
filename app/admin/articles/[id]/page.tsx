import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { listFields } from "@/lib/queries";
import { ArticleForm, DeleteArticleButton } from "../../forms";

/** Edits an article, or creates one when the id is "new". */
export default async function EditArticle({ params }: PageProps<"/admin/articles/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [fields, article] = await Promise.all([
    listFields(),
    id === "new" ? null : db.article.findUnique({ where: { id } }),
  ]);
  if (id !== "new" && !article) notFound();

  const values = article
    ? {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        body: article.body,
        fieldId: article.fieldId,
        authorName: article.authorName,
        tags: article.tags.join(", "),
        published: article.status === "PUBLISHED",
      }
    : { title: "", slug: "", excerpt: "", body: "", fieldId: fields[0]?.id ?? "", authorName: "", tags: "", published: false };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-medium text-brown">{article ? "Edit article" : "New article"}</h1>
        {article && <DeleteArticleButton id={article.id} title={article.title} className="btn btn-sm" />}
      </div>
      <div className="mt-8">
        <ArticleForm values={values} fields={fields.map((f) => ({ value: f.id, label: f.name }))} />
      </div>
    </div>
  );
}
