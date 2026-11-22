import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Motion";
import { Eyebrow, Heading, Lede, RuleGrid, Section, Wrap } from "@/components/Sections";
import { copy } from "@/content/copy";

export const metadata: Metadata = { title: copy.founderCircle.eyebrow, description: copy.founderCircle.intro };

export default function FounderCirclePage() {
  const fc = copy.founderCircle;
  const asItems = (list: string[]) => list.map((body) => ({ body }));
  return (
    <main>
      <section className="pt-20 pb-20 md:pt-28 md:pb-28">
        <Wrap>
          <Reveal>
            <Eyebrow>{fc.eyebrow}</Eyebrow>
            <h1 className="max-w-[18ch] text-[clamp(2.75rem,8vw,6rem)] leading-[1] font-light">{fc.heading}</h1>
          </Reveal>
          <Reveal delay={150}>
            <Lede className="mt-10 max-w-[48ch]">{fc.intro}</Lede>
          </Reveal>
        </Wrap>
      </section>

      <Section>
        <Heading eyebrow={fc.looking.eyebrow} title={fc.looking.heading} />
        <Reveal>
          <p className="mt-8 max-w-[62ch] text-lg">{fc.looking.body}</p>
        </Reveal>
        <RuleGrid items={asItems(fc.looking.items)} cols={2} large />
      </Section>

      <Section panel>
        <Heading eyebrow={fc.ask.eyebrow} title={fc.ask.heading} />
        <RuleGrid items={asItems(fc.ask.items)} cols={2} panel large />
      </Section>

      <Section>
        <Heading eyebrow={fc.not.eyebrow} title={fc.not.heading} />
        <RuleGrid items={asItems(fc.not.items)} cols={2} large />
        <Reveal>
          <p className="mt-14 max-w-[70ch] text-lg">{fc.not.note}</p>
        </Reveal>
      </Section>

      <Section panel>
        <Reveal>
          <Eyebrow>{copy.home.join.eyebrow}</Eyebrow>
          <p className="max-w-[30ch] font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.2] font-light text-gold">{copy.home.join.heading}</p>
          <Link href="/contact" className="btn btn-light mt-10">
            {fc.cta}
          </Link>
        </Reveal>
      </Section>
    </main>
  );
}
