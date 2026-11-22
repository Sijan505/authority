import Link from "next/link";
import { SignInButton } from "@/components/AuthButtons";
import { InquiryButton, InquiryPrompt } from "@/components/Inquiry";
import { IntroLoader } from "@/components/IntroLoader";
import { Reveal, ScrollWordmark } from "@/components/Motion";
import { Eyebrow, Heading, Lede, Section, Wrap } from "@/components/Sections";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

export default async function Home() {
  const { brand, home, platform } = copy;
  const viewer = await getViewer();

  // Signed-in visitors go to their dashboard instead of the sign-in flow.
  const join = (label: string, className: string) =>
    viewer ? (
      <Link href="/dashboard" className={className}>
        {copy.nav.dashboard}
      </Link>
    ) : (
      <SignInButton label={label} className={className} />
    );

  return (
    <main>
      <IntroLoader />
      <InquiryPrompt />

      {/* Hero */}
      <section className="flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden pt-14 pb-10">
        <Wrap className="flex w-full flex-1 flex-col">
          <div className="rise flex flex-wrap items-baseline justify-between gap-4 [animation-delay:.1s]">
            <p className="text-xs tracking-[0.32em] text-mute uppercase">{home.hero.eyebrow}</p>
            <p lang="ne" className="font-deva text-[clamp(1.125rem,2.4vw,1.75rem)] leading-[1.3] text-tika">
              {home.hero.deva}
            </p>
          </div>

          <div className="mt-auto pt-16">
            <ScrollWordmark
              word={brand.wordmark}
              className="mb-10 font-serif text-[clamp(2.75rem,12vw,9rem)] leading-[.9] font-light whitespace-nowrap"
            />
            <div className="grid items-end gap-10 md:grid-cols-[1.2fr_1fr]">
              <Reveal>
                <p className="mb-4 font-serif text-2xl font-light italic">{brand.tagline}</p>
                <Lede>{home.hero.lede}</Lede>
              </Reveal>
              <Reveal delay={120}>
                <p className="max-w-[56ch]">{home.hero.body}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <InquiryButton className="btn" />
                  <a href="#membership" className="btn btn-alt">
                    {home.hero.primary}
                  </a>
                </div>
              </Reveal>
            </div>
            <p className="mt-14 hidden text-xs tracking-[0.32em] text-mute uppercase md:block" aria-hidden="true">
              {home.hero.scroll} ↓
            </p>
          </div>
        </Wrap>
      </section>

      {/* 01 · The starting point */}
      <Section>
        <Heading eyebrow={home.start.eyebrow} title={home.start.heading} />
        <Reveal>
          <p className="mt-10 max-w-[62ch] text-lg">{home.start.body}</p>
        </Reveal>
      </Section>

      {/* 02 · The opportunity */}
      <Section>
        <Heading eyebrow={home.opportunity.eyebrow} title={home.opportunity.heading} />
        <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
          {home.opportunity.items.map((it, i) => (
            <Reveal key={it.who} delay={i * 90}>
              <div className="border-t border-ink pt-6">
                <h3 className="mb-3 text-[1.875rem] font-light">{it.who}</h3>
                <p>{it.what}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 03 · Gaas, Baas, Kapas */}
      <Section id="divisions">
        <Heading eyebrow={home.divisions.eyebrow} title={home.divisions.heading} />
        <div className="mt-14 grid gap-x-12 gap-y-12 md:grid-cols-3">
          {home.divisions.items.map((d, i) => (
            <Reveal key={d.name} delay={i * 90}>
              <div className="border-t border-ink pt-6">
                <div lang="ne" className="mb-5 font-deva text-[4rem] leading-none text-tika">
                  {d.deva}
                </div>
                <h3 className="text-[1.875rem] font-light">{d.name}</h3>
                <div className="mt-1 mb-3 text-sm text-mute">{d.kind}</div>
                <p>{d.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-20 grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <h3 className="text-[clamp(1.75rem,3.5vw,2.5rem)]">{home.divisions.peopleHeading}</h3>
          <p className="max-w-[62ch] text-lg">{home.divisions.peopleBody}</p>
        </Reveal>
      </Section>

      {/* 04 · One idea, six sides */}
      <Section id="platform" panel>
        <Heading eyebrow={home.platform.eyebrow} title={home.platform.heading} />
        <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
          {platform.sides.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 90}>
              <Link href={`/platform#${s.id}`} className="group block border-t border-ivory/40 pt-5">
                <h3 className="mb-2 font-sans text-[1.0625rem] font-semibold text-gold">
                  {s.pillar} · {s.name}
                </h3>
                <p className="opacity-85">{s.short}</p>
                <p className="mt-3 text-xs tracking-[0.2em] uppercase opacity-60 transition-opacity group-hover:opacity-100">{s.status}</p>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-14">
          <Link href="/platform" className="btn btn-light">
            {home.platform.cta}
          </Link>
        </Reveal>
      </Section>

      {/* 05 · Point of view */}
      <section className="overflow-hidden py-24 md:py-40">
        <Wrap>
          <Reveal>
            <Eyebrow>{home.pov.eyebrow}</Eyebrow>
          </Reveal>
          {home.pov.lines.map((line, i) => (
            <Reveal key={line} delay={i * 180}>
              <p className={`font-serif text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.02] font-light ${i === 1 ? "wordmark-gradient" : ""}`}>{line}</p>
            </Reveal>
          ))}
          <Reveal delay={360}>
            <p className="mt-12 max-w-[56ch] text-lg text-mute">{home.pov.body}</p>
          </Reveal>
        </Wrap>
      </section>

      {/* 06 · Honest about what exists */}
      <Section id="status">
        <Heading eyebrow={home.status.eyebrow} title={home.status.heading} />
        <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
          {home.status.columns.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <div className="border-t border-ink pt-6">
                <h3 className={`mb-3 text-[1.875rem] font-light ${i === 0 ? "text-tika" : ""}`}>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 07 · Membership */}
      <Section id="membership">
        <Heading eyebrow={home.tiers.eyebrow} title={home.tiers.heading} />
        <Reveal className="mt-14">
          <div className="grid border border-ink md:grid-cols-3">
            {home.tiers.items.map((t, i) => {
              const feat = i === 1;
              return (
                <div
                  key={t.name}
                  className={`border-b border-ink px-7 py-9 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 ${feat ? "bg-ink text-ivory" : ""}`}
                >
                  <h3 className="text-[1.75rem] font-light">{t.name}</h3>
                  <p className="mt-1.5 text-sm opacity-75">{t.price}</p>
                  <ul className="mt-4 list-disc space-y-2 pl-5">
                    {t.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {i === 0 && join(home.tiers.readerCta, "btn btn-alt")}
                    {i === 1 && (
                      <Link href="/membership" className="btn btn-light hover:text-white">
                        {home.tiers.memberCta}
                      </Link>
                    )}
                    {i === 2 && (
                      <Link href="/platform#perks" className="btn btn-alt">
                        {home.tiers.innerCta}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
        <p className="mt-5 text-sm text-mute">{home.tiers.note}</p>
      </Section>

      {/* 08 · Founder Circle */}
      <Section id="founder-circle" className="bg-gold-pale/40">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16">
          <Heading eyebrow={home.founderCircle.eyebrow} title={home.founderCircle.heading} />
          <Reveal delay={120}>
            <p className="mb-7 max-w-[56ch] text-lg">{home.founderCircle.body}</p>
            <Link href="/founder-circle" className="btn">
              {home.founderCircle.cta}
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <Heading eyebrow={home.faq.eyebrow} title={home.faq.heading} />
          <Reveal>
            {home.faq.items.map((f) => (
              <details key={f.q} className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 font-serif text-[1.375rem] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="text-mute transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[62ch]">
                  {f.a}
                  {f.privacyLink && (
                    <>
                      {" "}
                      <Link href="/privacy" className="link">
                        privacy note
                      </Link>
                      .
                    </>
                  )}{" "}
                  <span className="text-sm text-tika">{f.flag}</span>
                </p>
              </details>
            ))}
          </Reveal>
        </div>
      </Section>

      {/* An invitation */}
      <Section panel>
        <Reveal>
          <Eyebrow>{home.join.eyebrow}</Eyebrow>
          <div className="max-w-[44ch] space-y-5 font-serif text-[clamp(1.375rem,2.8vw,2rem)] leading-[1.35] font-light">
            {home.join.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="text-gold">{home.join.heading}</p>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-10 flex flex-wrap gap-3">
            <InquiryButton className="btn btn-light" />
            {join(copy.signIn.google, "btn btn-light")}
            <Link href="/contact" className="btn btn-light">
              {home.join.contact}
            </Link>
          </div>
          <p className="mt-20 font-serif text-[clamp(2rem,6vw,3.5rem)] font-light tracking-[0.3em]">{brand.wordmark}</p>
          <p className="mt-3 text-xs tracking-[0.32em] uppercase opacity-70">{brand.tagline}</p>
        </Reveal>
      </Section>
    </main>
  );
}
