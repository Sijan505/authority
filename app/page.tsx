import Image from "next/image";
import Link from "next/link";
import { SignInButton } from "@/components/AuthButtons";
import { LOGO_PATH } from "@/components/Decor";
import { InquiryButton, InquiryPrompt } from "@/components/Inquiry";
import { IntroLoader } from "@/components/IntroLoader";
import { Reveal, ScrollWordmark } from "@/components/Motion";
import { Eyebrow, Heading, Lede, Section, Wrap } from "@/components/Sections";
import { formatNPR, packages, proPrices, proYearlyFullPrice } from "@/config/pricing";
import { issueDrop, partners, partnerSlots } from "@/config/site";
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

      {/* A note from the founder */}
      <Section id="founder-note" className="bg-gold-pale/40">
        <div className="grid gap-12 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-20">
          <Reveal>
            <Eyebrow>{home.founderNote.eyebrow}</Eyebrow>
            <div className="flex items-center gap-5 md:block">
              <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-gold-pale md:mt-2 md:w-full">
                <Image src={copy.about.founder.photo} alt={home.founderNote.name} fill sizes="(min-width: 768px) 272px, 96px" className="object-cover" />
              </div>
              <div className="md:mt-5">
                <p className="font-serif text-[1.5rem] leading-tight font-light">{home.founderNote.name}</p>
                <p className="mt-1 text-sm text-mute">{home.founderNote.role}</p>
              </div>
            </div>
          </Reveal>
          <div>
            <Reveal>
              <h2 className="max-w-[22ch] font-serif text-[clamp(1.875rem,4.6vw,3.25rem)] leading-[1.1] font-light">{home.founderNote.headline}</h2>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-10 max-w-[44ch] space-y-6 border-t border-ink pt-8 font-serif text-[clamp(1.1875rem,2.2vw,1.5rem)] leading-[1.5] font-light">
                {home.founderNote.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <p className="wordmark-gradient font-normal">{home.founderNote.emphasis}</p>
                {home.founderNote.after.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                <InquiryButton className="btn" />
                <span className="font-serif text-lg italic text-mute">— {home.founderNote.name}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 01 · Gaas, Baas, Kapas */}
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

      {/* 02 · One idea, six sides */}
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

      {/* 03 · How it works */}
      <Section id="how-it-works">
        <Heading eyebrow={home.how.eyebrow} title={home.how.heading} />
        <ol className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
          {home.how.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <li className="border-t border-ink pt-6">
                <span className="mb-5 block font-serif text-[3.5rem] leading-none font-light text-tika tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mb-3 text-[1.75rem] font-light">{s.title}</h3>
                <p>{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-12">
          <InquiryButton className="btn" />
        </Reveal>
      </Section>

      {/* 04 · The first issue and The Issue Drop */}
      <Section id="issue" className="bg-gold-pale/40">
        <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr] md:gap-20">
          <Reveal>
            <MagazineCover />
          </Reveal>
          <div>
            <Heading eyebrow={home.issue.eyebrow} title={home.issue.heading} />
            <Reveal>
              <p className="mt-8 max-w-[52ch] text-lg">{home.issue.body}</p>
            </Reveal>
            <Reveal delay={120}>
              <IssueDrop />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 05 · Founding partners */}
      <Section id="partners">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16">
          <Heading eyebrow={home.partners.eyebrow} title={home.partners.heading} />
          <Reveal delay={120}>
            <p className="max-w-[52ch] text-lg">{home.partners.body}</p>
          </Reveal>
        </div>
        <Reveal className="mt-14">
          <ul className="grid grid-cols-2 border-t border-l border-line md:grid-cols-3">
            {Array.from({ length: Math.max(partnerSlots, partners.length) }, (_, i) => {
              const p = partners[i];
              const kind = p?.kind ?? home.partners.slotKinds[i % home.partners.slotKinds.length];
              return (
                <li key={i} className="flex min-h-36 flex-col justify-between border-r border-b border-line p-5 md:min-h-44 md:p-7">
                  <span className="text-[0.6875rem] tracking-[0.28em] text-mute uppercase">{kind}</span>
                  {p ? (
                    p.href ? (
                      <a href={p.href} target="_blank" rel="noopener noreferrer" className="font-serif text-[1.625rem] font-light hover:text-tika">
                        {p.name}
                      </a>
                    ) : (
                      <span className="font-serif text-[1.625rem] font-light">{p.name}</span>
                    )
                  ) : (
                    <span className="font-serif text-[1.375rem] font-light text-ink/30 italic">{home.partners.soon}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Reveal>
        <Reveal className="mt-10">
          <Link href="/contact" className="btn btn-alt">
            {home.partners.cta}
          </Link>
        </Reveal>
      </Section>

      {/* 06 · Point of view */}
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

      {/* 07 · Honest about what exists */}
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

      {/* 08 · Membership: one paid plan */}
      <Section id="membership">
        <Heading eyebrow={home.tiers.eyebrow} title={home.tiers.heading} />
        <Reveal className="mt-14">
          <div className="grid border border-ink md:grid-cols-[1fr_1.2fr]">
            <div className="bg-ink px-7 py-9 text-ivory md:px-10 md:py-12">
              <h3 className="text-[2rem] font-light">{home.tiers.name}</h3>
              <p className="mt-6">
                <span className="font-serif text-[2.5rem] leading-none font-light">{formatNPR(proPrices.MONTHLY)}</span>{" "}
                <span className="text-sm opacity-75">{copy.membership.monthly}</span>
              </p>
              <p className="mt-3">
                <span className="font-serif text-[1.5rem] font-light">{formatNPR(proPrices.YEARLY)}</span>{" "}
                <span className="text-sm opacity-75">
                  {copy.membership.yearly} · {copy.membership.yearlySaving(formatNPR(proYearlyFullPrice))}
                </span>
              </p>
              <p className="mt-6 max-w-[40ch] opacity-85">{home.tiers.body}</p>
            </div>
            <div className="flex flex-col px-7 py-9 md:px-10 md:py-12">
              <ul className="flex-1 space-y-3">
                {packages.PRO.features.map((f) => (
                  <li key={f} className="flex gap-3 border-b border-line pb-3">
                    <span className="text-tika" aria-hidden="true">
                      ✦
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                {viewer ? (
                  <Link href="/dashboard/membership" className="btn">
                    {home.tiers.cta}
                  </Link>
                ) : (
                  <SignInButton label={home.tiers.cta} callbackUrl="/dashboard/membership" className="btn" />
                )}
                <Link href="/platform#perks" className="btn btn-alt">
                  {home.tiers.perks}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
        <p className="mt-5 text-sm text-mute">{home.tiers.note}</p>
      </Section>

      {/* 09 · Founder Circle */}
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

/** Issue 01 as a type-only ivory cover; the photo slot waits for the titaura shoot. */
function MagazineCover() {
  const c = copy.home.issue.cover;
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-[400px] border border-ink/15 bg-ivory p-6 shadow-[0_30px_60px_-30px_rgba(59,26,18,0.45)] md:-rotate-2 md:p-8">
      <div className="flex h-full flex-col">
        <div className="flex items-baseline justify-between border-b border-ink pb-3">
          <span className="wordmark-gradient font-serif text-[clamp(1.5rem,4vw,2.125rem)] font-light tracking-[0.22em]">{copy.brand.wordmark}</span>
          <span className="text-[0.625rem] tracking-[0.28em] text-mute uppercase">{c.issue}</span>
        </div>
        <div className="my-5 grid flex-1 place-items-center bg-gold-pale/50">
          <div className="flex flex-col items-center gap-3 text-tika">
            <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden="true">
              <path d={LOGO_PATH} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <span className="text-[0.625rem] tracking-[0.32em] uppercase">{c.soon}</span>
          </div>
        </div>
        <p lang="ne" className="font-deva text-lg text-tika">
          {copy.home.hero.deva}
        </p>
        {c.lines.map((l, i) => (
          <p key={l} className={i === 0 ? "mt-1 text-[0.625rem] tracking-[0.28em] text-mute uppercase" : "mt-2 font-serif text-[1.25rem] leading-tight font-light italic"}>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

/** The first event, with a seat counter once real reservations are set in config/site.ts. */
function IssueDrop() {
  const e = copy.home.issue.event;
  const { seats, reserved, venue } = issueDrop;
  const share = reserved === null ? 0 : Math.min(1, reserved / seats);
  return (
    <div className="mt-10 bg-ink p-7 text-ivory md:p-9">
      <p className="text-[0.6875rem] tracking-[0.32em] text-gold uppercase">{e.label}</p>
      <h3 className="mt-3 text-[clamp(2rem,4vw,2.75rem)] leading-none font-light">{e.name}</h3>
      <p className="mt-4 max-w-[46ch] opacity-85">{e.body}</p>
      <p className="mt-2 text-sm opacity-60">{venue}</p>
      <div className="mt-7">
        {reserved !== null && (
          <div className="mb-3 h-px w-full bg-ivory/20" role="presentation">
            <div className="h-px origin-left bg-gold" style={{ transform: `scaleX(${share})` }} />
          </div>
        )}
        <p className="text-sm tracking-[0.12em] uppercase opacity-80 tabular-nums">{reserved === null ? e.seatsSoon(seats) : e.seatsOf(Math.min(reserved, seats), seats)}</p>
      </div>
      <div className="mt-7">
        <InquiryButton className="btn btn-light">{e.cta}</InquiryButton>
      </div>
    </div>
  );
}
