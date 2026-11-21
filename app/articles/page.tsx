import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Container, PageHeading } from "@/components/Decor";
import { copy } from "@/content/copy";
import { db } from "@/lib/db";
import { articleSummarySelect, listFields, publishedWhere } from "@/lib/queries";

export const metadata: Metadata = { title: copy.articles.heading };

export default async function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  const sp = await searchParams;
  const field = typeof sp.field === "string" ? sp.field.slice(0, 40) : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const t = copy.articles;

  const [fields, articles] = await Promise.all([
    listFields(),
    db.article.findMany({
      where: {
        ...publishedWhere(),
        ...(field ? { field: { slug: field } } : {}),
        ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 60,
      select: articleSummarySelect,
    }),
  ]);

  return (
    <Container>
      <PageHeading title={t.heading} intro={t.intro} />

      <form method="get" className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end" role="search">
        <div className="sm:w-48">
          <label htmlFor="field" className="label text-base">
            {t.filterLabel}
          </label>
          <select id="field" name="field" defaultValue={field} className="input">
            <option value="">{t.allFields}</option>
            {fields.map((f) => (
              <option key={f.id} value={f.slug}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="q" className="label text-base">
            {t.searchLabel}
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder={t.searchPlaceholder} className="input" />
        </div>
        <button type="submit" className="btn">
          {t.searchButton}
        </button>
      </form>

      {articles.length ? (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-center text-lg">{t.empty}</p>
      )}
    </Container>
  );
}
