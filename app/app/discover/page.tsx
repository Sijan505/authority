import { ArticleCard } from "@/components/ArticleCard";
import { AppHeader } from "@/components/AppHeader";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { articleSummarySelect, publishedWhere } from "@/lib/queries";

export const metadata = { title: "Discover" };

/** Article previews, the member's own field first. Full pieces stay members-only on the article page. */
export default async function DiscoverPage() {
  const viewer = await getViewer();
  const t = copy.app.discover;
  const articles = await db.article.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: articleSummarySelect,
  });
  const own = viewer?.user.fieldId;
  const sorted = own ? [...articles.filter((x) => x.fieldId === own), ...articles.filter((x) => x.fieldId !== own)] : articles;

  return (
    <main>
      <AppHeader label={t.heading} title={viewer?.user.field?.name ?? copy.nav.articles} />
      <div className="mx-auto max-w-xl px-5 pt-8 pb-10">
        <p className="text-mute">{t.intro}</p>
        {sorted.length === 0 ? (
          <p className="mt-8">{t.empty}</p>
        ) : (
          <ul className="mt-6 space-y-8">
            {sorted.map((x) => (
              <li key={x.id}>
                <ArticleCard article={x} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
