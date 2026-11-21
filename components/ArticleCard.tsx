import Link from "next/link";
import { fieldConfig } from "@/content/fields";

export type ArticleSummary = {
  slug: string;
  title: string;
  excerpt: string;
  authorName: string;
  publishedAt: Date | null;
  field: { slug: string; name: string };
};

export function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export function FieldTag({ slug, name }: { slug: string; name: string }) {
  const f = fieldConfig(slug);
  return (
    <span
      className="inline-block rounded-full border px-2.5 py-0.5 text-sm"
      style={{ color: f.accent, borderColor: `${f.accent}66` }}
    >
      {name}
    </span>
  );
}

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="flex h-full flex-col border-t border-gold/40 pt-5">
      <FieldTag slug={article.field.slug} name={article.field.name} />
      <h3 className="mt-3 text-2xl leading-snug font-medium text-brown">
        <Link href={`/articles/${article.slug}`} className="hover:underline hover:underline-offset-4">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1">{article.excerpt}</p>
      <p className="mt-3 text-sm text-ink/80">
        {article.authorName}
        {article.publishedAt && <> · {formatDate(article.publishedAt)}</>}
      </p>
    </article>
  );
}
