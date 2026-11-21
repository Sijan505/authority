import Link from "next/link";
import { SignInButton } from "@/components/AuthButtons";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-[1120px] px-6 ${className}`}>{children}</div>
);

function Section({ id, panel, children }: { id?: string; panel?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={`py-16 md:py-24 ${panel ? "bg-ink text-ivory" : "border-t border-line"}`}>
      <Wrap>{children}</Wrap>
    </section>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="max-w-[16ch] text-[clamp(2rem,5vw,3.25rem)]">{children}</h2>
);

const Lede = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`max-w-[34ch] font-serif text-[clamp(1.25rem,2.6vw,1.75rem)] leading-[1.45] font-light ${className}`}>{children}</p>
);

/** Row list used by the experiences and the roadmap. */
function RowList({ rows }: { rows: { title: string; note?: string; status: string; live?: boolean }[] }) {
  return (
    <ul className="mt-10 border-t border-line">
      {rows.map((r) => (
        <li key={r.title} className="flex flex-col gap-1 border-b border-line py-5 md:flex-row md:justify-between md:gap-6">
          <div>
            <b className="font-serif text-[1.375rem] font-normal">{r.title}</b>
            {r.note && <span className="text-mute"> {r.note}</span>}
          </div>
          <span className={`text-sm whitespace-nowrap ${r.live ? "text-tika" : "text-mute"}`}>{r.status}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Home() {
  const { brand, home } = copy;
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
      {/* Hero */}
      <section className="overflow-hidden pt-14 pb-20 md:pb-22">
        <Wrap>
          <p lang="ne" className="rise mb-7 font-deva text-[clamp(1.25rem,3vw,2.125rem)] leading-[1.3] text-tika [animation-delay:.2s]">
            {home.hero.deva}
          </p>
          <h1 className="mb-8 font-serif text-[clamp(3rem,15.5vw,13rem)] leading-[.9] font-light tracking-[-0.02em] whitespace-nowrap">
            <span className="rise inline-block [animation-delay:.1s]">Authority</span>
          </h1>
          <div className="grid items-end gap-12 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-4 font-serif text-2xl font-light italic">{brand.tagline}</p>
              <Lede>{home.hero.lede}</Lede>
            </div>
            <div>
              <p className="max-w-[62ch]">{home.hero.body}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#membership" className="btn">
                  {home.hero.primary}
                </a>
                <a href="#experiences" className="btn btn-alt">
                  {home.hero.secondary}
                </a>
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      {/* Experiences */}
      <Section id="experiences">
        <H2>{home.experiences.heading}</H2>
        <Lede className="mt-5 text-mute">{home.experiences.intro}</Lede>
        <RowList rows={home.experiences.items.map((i) => ({ title: i.title, note: i.body, status: i.tag }))} />
        <div className="mt-10 border border-dashed border-mute px-8 py-12">
          <h3 className="mb-2.5 text-[1.625rem] font-normal">{home.experiences.emptyHeading}</h3>
          <p className="mb-4 max-w-[62ch] text-mute">{home.experiences.emptyBody}</p>
          {join(home.experiences.emptyCta, "btn btn-alt")}
        </div>
      </Section>

      {/* Divisions */}
      <Section id="divisions">
        <H2>{home.divisions.heading}</H2>
        <div className="mt-12 grid border-t border-ink md:grid-cols-3">
          {home.divisions.items.map((d) => (
            <div
              key={d.name}
              className="border-b border-line py-7 md:mr-7 md:border-r md:border-b-0 md:pr-7 md:last:mr-0 md:last:border-r-0"
            >
              <div lang="ne" className="mb-4 font-deva text-[3.375rem] leading-none text-tika">
                {d.deva}
              </div>
              <h3 className="text-[1.625rem] font-normal">{d.name}</h3>
              <div className="mt-1 mb-3 text-sm text-mute">{d.kind}</div>
              <p>{d.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 grid gap-8 md:mt-18 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <h3 className="text-[1.625rem] font-normal">{home.divisions.peopleHeading}</h3>
          <p className="max-w-[62ch]">{home.divisions.peopleBody}</p>
        </div>
      </Section>

      {/* Address Book */}
      <Section id="address-book" panel>
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <H2>{home.addressBook.heading}</H2>
          <div>
            <Lede className="mb-4">{home.addressBook.lede}</Lede>
            <p className="mb-6 max-w-[62ch] opacity-70">{home.addressBook.body}</p>
            <a href="#roadmap" className="btn btn-light">
              {home.addressBook.cta}
            </a>
          </div>
        </div>
      </Section>

      {/* Roadmap */}
      <Section id="roadmap">
        <H2>{home.roadmap.heading}</H2>
        <p className="mt-5 text-mute">{home.roadmap.intro}</p>
        <RowList rows={home.roadmap.items} />
      </Section>

      {/* Membership */}
      <Section id="membership">
        <H2>{home.tiers.heading}</H2>
        <div className="mt-12 grid border border-ink md:grid-cols-3">
          {home.tiers.items.map((t, i) => {
            const feat = i === 1;
            return (
              <div
                key={t.name}
                className={`border-b border-ink px-7 py-9 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 ${feat ? "bg-ink text-ivory" : ""}`}
              >
                <h3 className="text-[1.625rem] font-normal">{t.name}</h3>
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
                    <a href="#faq" className="btn btn-alt">
                      {home.tiers.innerCta}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-sm text-mute">{home.tiers.note}</p>
      </Section>

      {/* About */}
      <Section id="about">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <H2>{home.about.heading}</H2>
          <div className="max-w-[62ch] space-y-4">
            <Lede>{home.about.lede}</Lede>
            {home.about.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="text-mute">{home.about.aside}</p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <H2>{home.faq.heading}</H2>
          <div>
            {home.faq.items.map((f) => (
              <details key={f.q} className="group border-b border-line py-5">
                <summary className="cursor-pointer list-none font-serif text-[1.375rem] [&::-webkit-details-marker]:hidden">
                  {f.q}
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
          </div>
        </div>
      </Section>

      {/* Closing */}
      <Section panel>
        <H2>{home.join.heading}</H2>
        <Lede className="mt-5">{home.join.body}</Lede>
        <div className="mt-7 flex flex-wrap gap-3">
          {join(copy.signIn.google, "btn btn-light")}
          <Link href="/contact" className="btn btn-light">
            {home.join.contact}
          </Link>
        </div>
      </Section>
    </main>
  );
}
