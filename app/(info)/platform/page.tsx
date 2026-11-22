import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Motion";
import { Eyebrow, Heading, Lede, RuleGrid, Section, Wrap } from "@/components/Sections";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.platform.heading, description: copy.platform.intro };

export default function PlatformPage() {
  const p = copy.platform;
  return (
    <main>
      <section className="pt-20 pb-16 md:pt-28">
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.home.platform.eyebrow.replace(/^\d+ · /, "")}</Eyebrow>
            <h1 className="text-[clamp(2.75rem,8vw,6rem)] leading-[1] font-light">{copy.home.platform.heading}</h1>
            <Lede className="mt-8 text-mute">{p.intro}</Lede>
          </Reveal>
          <Reveal delay={120}>
            <nav aria-label="The six sides" className="mt-12 flex flex-wrap gap-2">
              {p.sides.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="btn-ghost">
                  {s.name}
                </a>
              ))}
            </nav>
          </Reveal>
        </Wrap>
      </section>

      {/* The six sides, alternating light and dark like the presentation */}
      {p.sides.map((s, i) => {
        const dark = i % 2 === 0;
        return (
          <Section key={s.id} id={s.id} panel={dark}>
            <div className="grid gap-12 md:grid-cols-[1.15fr_1fr] md:gap-20">
              <Reveal>
                <Eyebrow>
                  {String(i + 1).padStart(2, "0")} · {s.pillar}
                </Eyebrow>
                <h2 className="mb-10 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1] font-light">{s.name}</h2>
                <div className="space-y-2">
                  {s.lines.map((line) => (
                    <p key={line} className={`font-serif text-[clamp(1.375rem,2.6vw,2rem)] leading-[1.25] font-light italic ${dark ? "text-gold" : "text-tika"}`}>
                      {line}
                    </p>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={150} className="flex flex-col justify-between gap-10 md:pt-40">
                <div className={`border-t pt-6 ${dark ? "border-ivory/40" : "border-ink"}`}>
                  <p className="text-lg">{s.body}</p>
                </div>
                <p className={`text-xs font-semibold tracking-[0.24em] uppercase ${dark ? "text-gold" : "text-tika"}`}>
                  {p.statusLabel}: {s.status}
                </p>
              </Reveal>
            </div>
          </Section>
        );
      })}

      <Section id="together">
        <Heading eyebrow={p.together.eyebrow} title={p.together.heading} />
        <RuleGrid items={p.together.items} cols={2} />
      </Section>

      <Section id="ideas" panel>
        <Heading eyebrow={p.ideas.eyebrow} title={p.ideas.heading} />
        <RuleGrid items={p.ideas.items} panel />
        <p className="mt-14 max-w-[70ch] opacity-75">{p.ideas.note}</p>
      </Section>

      <Section id="collaboration">
        <Heading eyebrow={p.collab.eyebrow} title={p.collab.heading} />
        <RuleGrid items={p.collab.steps.map((s, i) => ({ title: `${i + 1} · ${s.title}`, body: s.body }))} cols={4} />
        <p className="mt-14 max-w-[70ch] text-lg">{p.collab.note}</p>
      </Section>

      <Section id="perks" panel>
        <Heading eyebrow={p.perks.eyebrow} title={p.perks.heading} />
        <RuleGrid items={p.perks.items} panel />
        <p className="mt-14 max-w-[70ch] text-sm opacity-75">{p.perks.note}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#membership" className="btn btn-light">
            {copy.home.hero.primary}
          </Link>
          <Link href="/contact" className="btn btn-light">
            {copy.home.join.contact}
          </Link>
        </div>
      </Section>
    </main>
  );
}
