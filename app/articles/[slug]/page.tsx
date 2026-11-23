import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldTag, formatDate } from "@/components/ArticleCard";
import { SignInButton } from "@/components/AuthButtons";
import { BlockButton, CommentForm, ReportButton, ShareLinks } from "@/components/community";
import { FieldTheme } from "@/components/FieldTheme";
import { copy } from "@/content/copy";
import { canReadField, canUsePro, getViewer, hiddenUserIds, type Viewer } from "@/lib/access";
import { db } from "@/lib/db";
import { articleSummarySelect, publishedWhere } from "@/lib/queries";

async function findArticle(slug: string, viewer: Viewer | null) {
  return db.article.findFirst({
    // Admins can preview drafts; everyone else sees published articles only.
    where: viewer?.isAdmin ? { slug } : { slug, ...publishedWhere() },
    select: articleSummarySelect,
  });
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findFirst({ where: { slug, ...publishedWhere() }, select: { title: true, excerpt: true } });
  return article ? { title: article.title, description: article.excerpt } : {};
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const viewer = await getViewer();
  const article = await findArticle(slug, viewer);
  if (!article) notFound();

  const canRead = canReadField(viewer, article.fieldId);
  const pro = canUsePro(viewer, article.fieldId);
  const t = copy.articles;

  // The body is only loaded from the database after the access check passes.
  const body = canRead
    ? (await db.article.findUniqueOrThrow({ where: { id: article.id }, select: { body: true } })).body
    : null;

  const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/articles/${article.slug}`;

  return (
    <FieldTheme slug={article.field.slug}>
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-16">
        <FieldTag slug={article.field.slug} name={article.field.name} />
        <h1 className="mt-4 text-4xl leading-tight font-medium text-brown md:text-5xl">{article.title}</h1>
        <p className="mt-4 text-ink/90">
          {t.by} {article.authorName}
          {article.publishedAt && (
            <>
              {" · "}
              <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>
            </>
          )}
        </p>
        <div className="mt-6 h-px" style={{ background: "var(--accent)" }} role="presentation" />

        <p className="mt-8 text-xl leading-relaxed italic">{article.excerpt}</p>

        {body ? (
          <div className="mt-6 space-y-5 text-lg leading-relaxed">
            {body.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <Locked viewer={viewer} />
        )}

        {article.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2 text-sm">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded bg-[var(--tint)] px-2 py-0.5 text-brown">
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 border-t border-gold/30 pt-6">
          <ShareLinks url={url} title={article.title} />
        </div>

        {canRead && (
          <section aria-labelledby="comments-h" className="mt-12 border-t border-gold/30 pt-8">
            <h2 id="comments-h" className="text-3xl font-medium text-brown">
              {copy.comments.heading}
            </h2>
            {pro && viewer ? (
              <Comments articleId={article.id} viewer={viewer} />
            ) : (
              <p className="mt-3">
                {copy.comments.proOnly}{" "}
                <Link href="/dashboard/membership" className="link">
                  {copy.dashboard.upgradeCta}
                </Link>
              </p>
            )}
          </section>
        )}
      </main>
    </FieldTheme>
  );
}

function Locked({ viewer }: { viewer: Viewer | null }) {
  const t = copy.articles;
  const message = !viewer ? t.lockedSignedOut : !viewer.onboarded ? t.lockedOnboarding : viewer.plan ? t.lockedOtherField : t.lockedNotMember;
  const action = !viewer
    ? null
    : !viewer.onboarded
      ? { href: "/onboarding", label: t.onboardingCta }
      : viewer.plan
        ? { href: "/dashboard", label: copy.nav.dashboard }
        : { href: "/dashboard/membership", label: t.memberCta };
  return (
    <div className="card mt-8 text-center">
      <h2 className="text-2xl font-medium text-brown">{t.lockedHeading}</h2>
      <p className="mt-2">{message}</p>
      <div className="mt-5">
        {action ? (
          <Link href={action.href} className="btn btn-sm">
            {action.label}
          </Link>
        ) : (
          <SignInButton label={t.signInCta} callbackUrl="/dashboard/membership" className="btn btn-sm" />
        )}
      </div>
    </div>
  );
}

async function Comments({ articleId, viewer }: { articleId: string; viewer: Viewer }) {
  const hidden = await hiddenUserIds(viewer.user.id);
  const comments = await db.comment.findMany({
    where: { articleId, userId: { notIn: hidden } },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { user: { select: { id: true, name: true } } },
  });

  return (
    <>
      {comments.length === 0 ? (
        <p className="mt-3">{copy.comments.empty}</p>
      ) : (
        <ul className="mt-5 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="border-l-2 pl-4" style={{ borderColor: "var(--accent)" }}>
              <p className="text-sm font-semibold text-brown">
                {c.user.name} <span className="font-normal text-ink/80">· {formatDate(c.createdAt)}</span>
              </p>
              <p className="mt-1 whitespace-pre-line">{c.removedAt ? copy.comments.removed : c.body}</p>
              {!c.removedAt && c.user.id !== viewer.user.id && (
                <div className="mt-1 flex gap-4">
                  <ReportButton targetType="comment" targetId={c.id} />
                  <BlockButton userId={c.user.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <CommentForm articleId={articleId} />
    </>
  );
}
