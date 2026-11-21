import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { SignInButton } from "@/components/AuthButtons";
import { Eyebrow, Placeholder, Star } from "@/components/Decor";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { articleSummarySelect, publishedWhere } from "@/lib/queries";

function Section({ eyebrow, heading, children }: { eyebrow: string; heading: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-3 text-4xl font-medium text-brown md:text-5xl">{heading}</h2>
        </div>
        <div className="mt-10 md:mt-12">{children}</div>
      </div>
    </section>
  );
}

const Divider = () => <div className="gold-rule mx-auto max-w-3xl opacity-60" role="presentation" />;

export default async function Home() {
  const { brand, home } = copy;
  const [viewer, articles] = await Promise.all([
    getViewer(),
    db.article.findMany({ where: publishedWhere(), orderBy: { publishedAt: "desc" }, take: 6, select: articleSummarySelect }),
  ]);

  const cta = viewer ? (
    <Link href="/dashboard" className="btn">
      {copy.nav.dashboard}
    </Link>
  ) : (
    <SignInButton />
  );

  return (
    <main>
      <section className="flex flex-col items-center px-4 py-20 text-center sm:px-6 md:py-28">
        <Star className="h-10 w-10 md:h-12 md:w-12" />
        <h1 className="mt-5 text-[2.75rem] leading-none font-semibold tracking-[0.12em] text-brown min-[400px]:text-5xl sm:text-7xl sm:tracking-[0.18em] md:text-8xl">
          <span className="sr-only">Authority</span>
          <span aria-hidden="true">{brand.wordmark}</span>
        </h1>
        <p className="gold-text mt-4 text-xl italic md:text-2xl">{brand.tagline}</p>
        <div className="gold-rule mt-8 w-24" role="presentation" />
        <p className="mt-8 max-w-xl text-xl leading-relaxed md:text-2xl">{home.whatIs.body[0]}</p>
        <div className="mt-10">{cta}</div>
      </section>

      <Divider />

      <Section eyebrow={home.whatIs.eyebrow} heading={home.whatIs.heading}>
        <div className="mx-auto max-w-2xl space-y-4 text-center text-xl leading-relaxed">
          {home.whatIs.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Section>

      <Divider />

      <Section eyebrow={home.whatItDoes.eyebrow} heading={home.whatItDoes.heading}>
        <ul className="grid gap-8 md:grid-cols-3">
          {home.whatItDoes.items.map((i) => (
            <li key={i.title} className="border-t border-gold/50 pt-5">
              <h3 className="text-2xl font-semibold text-brown">{i.title}</h3>
              <p className="mt-2">{i.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Divider />

      <Section eyebrow={home.audience.eyebrow} heading={home.audience.heading}>
        <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
          {home.audience.cards.map((c) => (
            <li key={c.title} className="text-center">
              <Placeholder label={c.image} className="aspect-[4/3] rounded-sm md:aspect-[4/5]" />
              <h3 className="mt-5 text-3xl font-medium text-brown">{c.title}</h3>
              <p className="text-lg italic text-gold-dark">{c.subtitle}</p>
              <p className="mt-2">{c.body}</p>
            </li>
          ))}
        </ul>
        <ul className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {home.audience.extra.map((c) => (
            <li key={c.title} className="card text-center">
              <h3 className="text-2xl font-medium text-brown">{c.title}</h3>
              <p className="mt-1">{c.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Divider />

      <Section eyebrow={home.articles.eyebrow} heading={home.articles.heading}>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center">
          <Link href="/articles" className="link text-lg">
            {home.articles.all} →
          </Link>
        </p>
      </Section>

      <Divider />

      <section className="px-4 py-16 text-center sm:px-6 md:py-20">
        <h2 className="text-4xl font-medium text-brown">{home.join.heading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg">{home.join.body}</p>
        <div className="mt-8">{cta}</div>
      </section>
    </main>
  );
}
