import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Motion";
import { Eyebrow, Heading, Lede, RuleGrid, Section, Wrap } from "@/components/Sections";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.about.heading, description: copy.about.lede };

export default function AboutPage() {
  const a = copy.about;
  return (
    <main>
      <section className="pt-20 pb-20 md:pt-28 md:pb-28">
        <Wrap>
          <Reveal>
            <Eyebrow>{a.eyebrow}</Eyebrow>
            <h1 className="max-w-[20ch] text-[clamp(2.5rem,6.5vw,5rem)] leading-[1.05] font-light">{a.lede}</h1>
          </Reveal>
          <Reveal delay={150} className="mt-12 grid gap-6 md:ml-[40%]">
            {a.body.map((p) => (
              <p key={p} className="max-w-[60ch] text-lg">
                {p}
              </p>
            ))}
          </Reveal>
        </Wrap>
      </section>

      <Section panel>
        <Reveal>
          <Eyebrow>{copy.home.pov.eyebrow.replace(/^\d+ · /, "")}</Eyebrow>
          {copy.home.pov.lines.map((line) => (
            <p key={line} className="font-serif text-[clamp(2.25rem,7vw,5.5rem)] leading-[1.05] font-light">
              {line}
            </p>
          ))}
          <p className="mt-10 max-w-[56ch] text-lg opacity-80">{copy.home.pov.body}</p>
        </Reveal>
      </Section>

      <Section>
        <Heading eyebrow={a.care.eyebrow} title={a.care.heading} />
        <RuleGrid items={a.care.items.map((body) => ({ body }))} cols={2} large />
      </Section>

      {/* The founder */}
      <Section id="founder" panel>
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
          <Reveal>
            <div className="relative aspect-[1000/1362] w-full overflow-hidden bg-gold-pale">
              <Image src={a.founder.photo} alt={a.founder.name} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <Eyebrow>{a.founder.eyebrow}</Eyebrow>
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1] font-light">{a.founder.name}</h2>
            <ul className="mt-8 space-y-1 text-lg text-gold">
              {a.founder.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <Lede className="mt-10">{a.founder.body}</Lede>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Heading eyebrow={a.future.eyebrow} title={a.future.heading} />
        <RuleGrid items={a.future.items.map((body) => ({ body }))} large />
        <Reveal>
          <p className="mt-14 text-lg text-mute">{a.future.note}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/founder-circle" className="btn">
              {copy.nav.founderCircle}
            </Link>
            <Link href="/contact" className="btn btn-alt">
              {copy.home.join.contact}
            </Link>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
