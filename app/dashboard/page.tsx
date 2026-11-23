import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard, formatDate } from "@/components/ArticleCard";
import { Placeholder } from "@/components/Decor";
import { copy } from "@/content/copy";
import { fieldConfig } from "@/content/fields";
import { requireOnboarded, type Viewer } from "@/lib/access";
import { db } from "@/lib/db";
import { proStatus, type ProStatus } from "@/lib/membership";
import { articleSummarySelect, liveOffersWhere, publishedWhere } from "@/lib/queries";

export const metadata: Metadata = { title: copy.dashboard.home };

export default async function DashboardPage() {
  const viewer = await requireOnboarded();
  const t = copy.dashboard;

  const f = fieldConfig(viewer.user.field?.slug);

  // Field content is for paying members (and admins). Everyone else sees how to join.
  if (viewer.plan !== "PRO" && !viewer.isAdmin) {
    const pro = await proStatus(viewer.user.id, false);
    return (
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
        <header className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] accent-text">{f.name}</p>
          <h1 className="mt-2 text-4xl font-medium text-brown md:text-5xl">{f.heroTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg">{f.heroText}</p>
        </header>
        <Notices viewer={viewer} pro={pro} />
      </main>
    );
  }

  // Everything below is scoped to the member's own field.
  const fieldId = viewer.user.fieldId!;
  const [articles, offers, pro] = await Promise.all([
    db.article.findMany({
      where: { ...publishedWhere(), fieldId },
      orderBy: { publishedAt: "desc" },
      take: 13,
      select: articleSummarySelect,
    }),
    db.offer.findMany({ where: liveOffersWhere(fieldId), orderBy: [{ venue: "asc" }, { createdAt: "desc" }] }),
    proStatus(viewer.user.id, viewer.plan === "PRO"),
  ]);
  const [featured, ...rest] = articles;

  const venues = Object.entries(
    offers.reduce<Record<string, typeof offers>>((acc, o) => {
      (acc[o.venue] ??= []).push(o);
      return acc;
    }, {}),
  );

  const blocks = {
    featured: featured && (
      <section key="featured" aria-labelledby="featured-h" className="grid items-center gap-8 md:grid-cols-2">
        <Placeholder label={`Image: ${f.name}`} className="aspect-[4/3] rounded-sm" />
        <div>
          <p className="text-sm uppercase tracking-[0.2em] accent-text">{f.featuredLabel}</p>
          <h2 id="featured-h" className="mt-2 text-3xl leading-tight font-medium text-brown md:text-4xl">
            <Link href={`/articles/${featured.slug}`} className="hover:underline hover:underline-offset-4">
              {featured.title}
            </Link>
          </h2>
          <p className="mt-3 text-lg">{featured.excerpt}</p>
          <p className="mt-2 text-sm">
            {featured.authorName} · {formatDate(featured.publishedAt)}
          </p>
        </div>
      </section>
    ),
    articles: (rest.length > 0 || !featured) && (
      <section key="articles" aria-labelledby="articles-h">
        <h2 id="articles-h" className="text-3xl font-medium text-brown">
          {t.articles}
        </h2>
        {rest.length ? (
          <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <li key={a.id}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4">{t.noArticles}</p>
        )}
      </section>
    ),
    offers: (
      <section key="offers" aria-labelledby="offers-h">
        <h2 id="offers-h" className="text-3xl font-medium text-brown">
          {f.offersTitle}
        </h2>
        <p className="mt-2">{f.offersIntro}</p>
        {offers.length ? (
          <ul className="mt-6 divide-y divide-gold/30 border-y border-gold/30">
            {offers.map((o) => (
              <li key={o.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <span>
                  <strong className="text-brown">{o.name}</strong> · {o.venue}
                </span>
                <span className="accent-text">{o.discountText}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 italic">{t.noOffers}</p>
        )}
      </section>
    ),
    venues: venues.length > 0 && (
      <section key="venues" aria-labelledby="venues-h">
        <h2 id="venues-h" className="text-3xl font-medium text-brown">
          {t.venues}
        </h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map(([venue, list]) => (
            <li key={venue} className="card border-t-4" style={{ borderTopColor: "var(--accent)" }}>
              <h3 className="text-2xl font-medium text-brown">{venue}</h3>
              <ul className="mt-3 space-y-3">
                {list.map((o) => (
                  <li key={o.id}>
                    <p className="text-lg font-semibold accent-text">{o.discountText}</p>
                    <p className="text-sm">
                      {o.name}
                      {o.validUntil && (
                        <>
                          {" "}
                          · {t.valid} {t.until} {formatDate(o.validUntil)}
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    ),
  };

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
      <Notices viewer={viewer} pro={pro} />
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] accent-text">{f.name}</p>
        <h1 className="mt-2 text-5xl font-medium text-brown md:text-6xl">{f.heroTitle}</h1>
        <p className="mx-auto mt-3 max-w-xl text-xl">{f.heroText}</p>
        <div className="mx-auto mt-6 h-px w-24" style={{ background: "var(--accent)" }} role="presentation" />
      </header>
      {f.layout.map((key) => blocks[key])}
    </main>
  );
}

function Notices({ viewer, pro }: { viewer: Viewer; pro: ProStatus }) {
  const t = copy.dashboard;
  const member = viewer.plan === "PRO";
  if (!viewer.showRenewal && member) return null;
  const status = {
    pending: [t.pendingHeading, t.pendingBody],
    rejected: [t.rejectedHeading, t.rejectedBody],
    expired: [t.expiredHeading, t.expiredBody],
  }[pro.state as "pending" | "rejected" | "expired"];
  return (
    <div className="space-y-4">
      {status && (
        <div role="status" className="card">
          <p className="text-xl font-semibold text-brown">{status[0]}</p>
          <p>{status[1]}</p>
          {pro.note && (
            <p className="mt-2">
              <strong className="text-brown">{copy.join.note}:</strong> {pro.note}
            </p>
          )}
        </div>
      )}
      {viewer.showRenewal && viewer.daysLeft !== null && (
        <div role="status" className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold text-brown">{t.renewHeading(viewer.daysLeft)}</p>
            <p>
              {t.renewBody} {t.expires}: {formatDate(viewer.proExpiresAt)}
            </p>
          </div>
          <Link href="/dashboard/membership" className="btn btn-accent btn-sm shrink-0">
            {t.renewCta}
          </Link>
        </div>
      )}
      {!member && pro.state !== "pending" && (
        <div className="card flex flex-col gap-3 border-2 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--accent)" }}>
          <div>
            <p className="text-2xl font-medium text-brown">{t.upgradeHeading}</p>
            <p>{t.upgradeBody}</p>
          </div>
          <Link href="/dashboard/membership" className="btn btn-accent shrink-0">
            {t.upgradeCta}
          </Link>
        </div>
      )}
    </div>
  );
}
