import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SignInButton } from "@/components/AuthButtons";
import { LOGO_PATH } from "@/components/Decor";
import { InquiryButton } from "@/components/Inquiry";
import { MemberCard } from "@/components/MemberCard";
import { SwipeRail } from "@/components/SwipeRail";
import { issueDrop } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { firstName, memberNumber, partOfDay } from "@/lib/app";
import { db } from "@/lib/db";
import { cardFor } from "@/lib/member-card";
import { photoUrl } from "@/lib/photo";

export const metadata = { title: "Home" };

// Each world's colours, from the website's field palette (content/fields.ts).
const WORLD_COLOURS: Record<string, { accent: string; tint: string }> = {
  dining: { accent: "#6B4A12", tint: "#F1E2C0" }, // Gaas: warm amber
  stays: { accent: "#6A5016", tint: "#EEE3BE" }, // Baas: olive gold
  invitation: { accent: "#5E2A1C", tint: "#EBD6C8" }, // deep wine
  "first-look": { accent: "#7A3F22", tint: "#F0DCC4" }, // Kapas: terracotta
  "good-life": { accent: "#5C4A2A", tint: "#E9E0C8" }, // stone
};

const today = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kathmandu" });

/** A numbered section title with a hairline, like a magazine's contents. */
function SectionTitle({ n, children, id }: { n: number; children: React.ReactNode; id?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="font-serif text-[0.9375rem] text-tika tabular-nums">{String(n).padStart(2, "0")}</span>
      <h2 id={id} className="text-[0.6875rem] font-semibold tracking-[0.28em] whitespace-nowrap uppercase">
        {children}
      </h2>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}

function StarMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d={LOGO_PATH} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** The app's home: greeting, membership card, the five worlds, reading, and what's coming up. */
export default async function AppHome() {
  const viewer = await getViewer();
  const a = copy.app;
  const member = viewer?.plan === "PRO";
  const [number, unread, card] = await Promise.all([
    memberNumber(viewer),
    viewer ? db.notification.count({ where: { userId: viewer.user.id, readAt: null } }) : 0,
    cardFor(viewer),
  ]);
  const avatar = viewer ? photoUrl(viewer.user) : null;
  const tier = !viewer ? a.tierGuest : member ? a.tierMember : a.tierNotMember;
  const first = firstName(viewer?.user.name);
  const e = copy.home.issue.event;
  let section = 0;

  const right = (
    <div className="flex shrink-0 items-center gap-2">
      {viewer && (
        <Link href="/app/notifications" aria-label={copy.social.notifications} className="relative grid h-11 w-11 place-items-center rounded-full text-ink/75 hover:text-ink">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.5625rem] font-semibold text-[#3b1a12]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      )}
      <Link href="/app/account" aria-label={a.tabs.account} className="block h-12 w-12 overflow-hidden rounded-full border border-gold/60 bg-gold-pale/40 p-0.5">
        <span className="block h-full w-full overflow-hidden rounded-full">
          {avatar ? (
            // Uploaded or Google profile photos; next/image would need their host configured.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid h-full w-full place-items-center font-serif text-lg text-tika">{first.charAt(0) || "A"}</span>
          )}
        </span>
      </Link>
    </div>
  );

  return (
    <main>
      <AppHeader label={a.dashboard} right={right}>
        <p className="mt-6 text-[0.6875rem] tracking-[0.22em] text-mute uppercase">{today()}</p>
        <h1 className="mt-2 font-serif text-[2.125rem] leading-[1.08] font-light">
          {a.greetingPart(partOfDay())}
          {first && (
            <>
              ,<br />
              <em className="text-tika">{first}</em>
            </>
          )}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.625rem] font-semibold tracking-[0.18em] uppercase">
          <span className="rounded-full border border-tika/60 px-2.5 py-1 text-tika">{tier}</span>
          {number && <span className="rounded-full border border-line px-2.5 py-1 text-mute">{a.memberNo(number)}</span>}
        </div>
      </AppHeader>

      <div className="mx-auto max-w-xl px-5 pt-8 pb-12">
        {!viewer && (
          <section className="mb-10 border border-gold/50 bg-paper/70 p-6">
            <p className="text-[0.625rem] font-semibold tracking-[0.24em] text-tika uppercase">{a.guest.kicker}</p>
            <h2 className="mt-2 font-serif text-[1.75rem] leading-tight font-light">{a.guest.heading}</h2>
            <p className="mt-2 text-mute">{a.guest.body}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <SignInButton label={a.guest.signIn} callbackUrl="/app" className="btn" />
              <InquiryButton className="btn btn-alt">{a.guest.register}</InquiryButton>
            </div>
          </section>
        )}

        {card && (
          <section aria-labelledby="card-h" className="mb-12">
            <SectionTitle n={++section} id="card-h">
              {a.card.heading}
            </SectionTitle>
            <Link href="/app/account#card" className="block" aria-label={a.card.heading}>
              <MemberCard card={card} />
            </Link>
            <p className="mt-3 text-center text-sm text-mute">{card.qr ? a.card.hint : a.card.notMember}</p>
          </section>
        )}

        {viewer && !member && (
          <section className="app-panel mb-12 border border-gold/40 bg-gold-pale/30 p-6 text-ink">
            <h2 className="font-serif text-[1.5rem] font-light">{a.join.heading}</h2>
            <p className="mt-2 opacity-80">{a.join.body}</p>
            <Link href="/dashboard/membership" className="btn mt-5">
              {a.join.cta}
            </Link>
          </section>
        )}

        <section aria-labelledby="worlds-h" className="mb-12">
          <SectionTitle n={++section} id="worlds-h">
            {a.forYou}
          </SectionTitle>
          <p className="-mt-2 mb-5 font-serif text-[1.25rem] leading-snug font-light italic">{a.prompt}</p>
          <SwipeRail label={a.forYou}>
            {a.tiles.map((tile, i) => {
              const c = WORLD_COLOURS[tile.key];
              return (
                <Link
                  key={tile.key}
                  href={member ? `/app/concierge?c=${encodeURIComponent(tile.category)}` : viewer ? "/dashboard/membership" : "/app/account"}
                  className="world-card group relative flex aspect-[4/5] w-[78%] max-w-[320px] shrink-0 snap-start flex-col justify-between overflow-hidden p-5"
                  style={{ "--tile-accent": c.accent, "--tile-tint": c.tint } as React.CSSProperties}
                >
                  <div className="flex items-center justify-between text-[0.625rem] font-semibold tracking-[0.24em] uppercase">
                    <span>
                      {String(i + 1).padStart(2, "0")} · {tile.kicker}
                    </span>
                    <span className="opacity-60">
                      {i + 1} / {a.tiles.length}
                    </span>
                  </div>

                  <div className="grid flex-1 place-items-center">
                    {tile.deva ? (
                      <span lang="ne" className="font-deva text-[4.5rem] leading-none">
                        {tile.deva}
                      </span>
                    ) : (
                      <StarMark className="h-20 w-20" />
                    )}
                  </div>

                  <div>
                    <span className="world-rule mb-3 block h-px w-10" aria-hidden="true" />
                    <h3 className="font-serif text-[1.75rem] leading-tight font-light">{tile.title}</h3>
                    <p className="mt-1.5 text-[0.875rem] leading-snug opacity-80">{tile.body}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.2em] uppercase">
                      {a.explore} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </SwipeRail>
        </section>

        <section aria-labelledby="read-h" className="mb-12">
          <SectionTitle n={++section} id="read-h">
            {a.readHeading}
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/app/discover", label: a.tabs.discover, body: a.readBody, icon: <path d="M5 4.5h9.5l4.5 4.5v10.5H5zM14.5 4.5V9H19M8 12.5h8M8 15.5h6" /> },
              { href: "/app/forum", label: a.tabs.forum, body: a.forumBody, icon: <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" /> },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="group flex flex-col justify-between gap-6 border border-line bg-paper/70 p-4 transition-colors hover:border-tika">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-tika" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {l.icon}
                </svg>
                <span>
                  <span className="block font-serif text-[1.25rem] leading-tight">{l.label}</span>
                  <span className="mt-1 block text-[0.8125rem] text-mute">{l.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="radar-h">
          <SectionTitle n={++section} id="radar-h">
            {a.radar}
          </SectionTitle>
          <details className="app-panel group overflow-hidden border border-gold/40 bg-paper/70 text-ink">
            <summary className="block cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="world-card relative grid h-36 place-items-center" style={{ "--tile-accent": "#3B1F12", "--tile-tint": "#EADFD3" } as React.CSSProperties}>
                <StarMark className="h-14 w-14" />
                <span className="absolute top-4 left-4 text-[0.625rem] font-semibold tracking-[0.24em] uppercase">{e.label}</span>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-[1.75rem] leading-tight font-light">{e.name}</h3>
                <p className="mt-1 text-sm text-mute">{issueDrop.venue}</p>
                <span className="mt-4 inline-block text-[0.6875rem] font-semibold tracking-[0.2em] text-tika uppercase">
                  <span className="group-open:hidden">{a.viewEvent} →</span>
                  <span className="hidden group-open:inline">{a.hideEvent}</span>
                </span>
              </div>
            </summary>
            <div className="border-t border-line px-5 pt-4 pb-5">
              <p className="opacity-85">{e.body}</p>
              <p className="mt-3 text-sm tracking-[0.12em] uppercase opacity-70">
                {issueDrop.reserved === null ? e.seatsSoon(issueDrop.seats) : e.seatsOf(Math.min(issueDrop.reserved, issueDrop.seats), issueDrop.seats)}
              </p>
              <div className="mt-4">
                {member ? (
                  <Link href={`/app/concierge?c=${encodeURIComponent("Experiences")}`} className="btn btn-sm">
                    {copy.app.concierge.submit}
                  </Link>
                ) : (
                  <InquiryButton className="btn btn-sm">{e.cta}</InquiryButton>
                )}
              </div>
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
