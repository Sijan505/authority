// Layout pieces for the editorial pages (home, platform, founder circle, about),
// styled after the founding presentation: numbered eyebrows, big serif headings
// and items that sit under a hairline rule.
import { Reveal } from "@/components/Motion";

export const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-[1120px] px-6 ${className}`}>{children}</div>
);

/** A full-width band. `panel` is the dark brown band with ivory text. */
export function Section({
  id,
  panel,
  className = "",
  children,
}: {
  id?: string;
  panel?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`py-20 md:py-32 ${panel ? "bg-ink text-ivory" : "border-t border-line"} ${className}`}>
      <Wrap>{children}</Wrap>
    </section>
  );
}

/** Small spaced capitals above a heading, e.g. "04 · THE PLATFORM". */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-6 text-xs tracking-[0.32em] uppercase opacity-70 ${className}`}>{children}</p>;
}

export const H2 = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`max-w-[20ch] text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05] ${className}`}>{children}</h2>
);

export const Lede = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`max-w-[40ch] font-serif text-[clamp(1.25rem,2.4vw,1.625rem)] leading-[1.45] font-light ${className}`}>{children}</p>
);

/** Eyebrow + heading, revealed on scroll. */
export function Heading({ eyebrow, title, className = "" }: { eyebrow?: string; title: string; className?: string }) {
  return (
    <Reveal className={className}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <H2>{title}</H2>
    </Reveal>
  );
}

/**
 * A grid of items, each under a hairline rule, revealed in a stagger.
 * `title` is optional; `panel` switches to colours for the dark band.
 */
export function RuleGrid({
  items,
  cols = 3,
  panel,
  large,
  className = "",
}: {
  items: { title?: string; body: string }[];
  cols?: 2 | 3 | 4;
  panel?: boolean;
  /** Bigger body text, for lists without titles. */
  large?: boolean;
  className?: string;
}) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <div className={`mt-14 grid gap-x-12 gap-y-10 ${grid} ${className}`}>
      {items.map((it, i) => (
        <Reveal key={(it.title ?? "") + it.body} delay={(i % cols) * 90}>
          <div className={`border-t pt-5 ${panel ? "border-ivory/40" : "border-ink"}`}>
            {it.title && <h3 className={`mb-2 font-sans text-[1.0625rem] font-semibold ${panel ? "text-gold" : "text-tika"}`}>{it.title}</h3>}
            <p className={large ? "font-serif text-[1.375rem] leading-snug font-light" : panel ? "opacity-85" : ""}>{it.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
