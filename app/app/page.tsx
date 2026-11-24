import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SignInButton } from "@/components/AuthButtons";
import { LOGO_PATH } from "@/components/Decor";
import { InquiryButton } from "@/components/Inquiry";
import { issueDrop } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { firstName, memberNumber, partOfDay } from "@/lib/app";
import { db } from "@/lib/db";

export const metadata = { title: "Home" };

/** The app's home: greeting, the five ways in to the Request Desk, and what's coming up. */
export default async function AppHome() {
  const viewer = await getViewer();
  const a = copy.app;
  const member = viewer?.plan === "PRO";
  const [number, replies] = await Promise.all([
    memberNumber(viewer),
    member ? db.conciergeRequest.count({ where: { userId: viewer!.user.id, reply: { not: null }, status: { in: ["IN_PROGRESS", "DONE", "DECLINED"] } } }) : 0,
  ]);
  const tier = !viewer ? a.tierGuest : member ? a.tierMember : a.tierNotMember;
  const e = copy.home.issue.event;

  const right = (
    <div className="flex shrink-0 items-center gap-3">
      {viewer && (
        <Link href="/app/concierge#requests" aria-label={a.notifications} className="relative grid h-11 w-11 place-items-center text-ivory/85 hover:text-ivory">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
          </svg>
          {replies > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-gold" aria-hidden="true" />}
        </Link>
      )}
      <Link href="/app/account" aria-label={a.tabs.account} className="block h-14 w-14 overflow-hidden rounded-full border border-gold/50 bg-ivory/10">
        {viewer?.user.image ? (
          // Google profile photos; next/image would need their host configured.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewer.user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-full w-full place-items-center font-serif text-xl text-gold">{firstName(viewer?.user.name).charAt(0) || "A"}</span>
        )}
      </Link>
    </div>
  );

  return (
    <main>
      <AppHeader label={a.dashboard} right={right}>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <h1 className="font-serif text-[1.75rem] leading-tight font-light">{a.greeting(partOfDay(), firstName(viewer?.user.name))}</h1>
          <div className="text-right text-[0.6875rem] tracking-[0.2em] uppercase">
            <p className="text-gold">{tier}</p>
            {number && <p className="mt-1 text-ivory/80">{a.memberNo(number)}</p>}
          </div>
        </div>
        <p className="mt-3 text-ivory/75">{a.prompt}</p>
      </AppHeader>

      <div className="mx-auto max-w-xl px-5 pt-8 pb-10">
        {!viewer && (
          <section className="mb-8 border border-ink p-6">
            <h2 className="font-serif text-[1.5rem] font-light">{a.guest.heading}</h2>
            <p className="mt-2 text-mute">{a.guest.body}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <SignInButton label={a.guest.signIn} callbackUrl="/app" className="btn" />
              <InquiryButton className="btn btn-alt">{a.guest.register}</InquiryButton>
            </div>
          </section>
        )}
        {viewer && !member && (
          <section className="mb-8 bg-ink p-6 text-ivory">
            <h2 className="font-serif text-[1.5rem] font-light">{a.join.heading}</h2>
            <p className="mt-2 opacity-80">{a.join.body}</p>
            <Link href="/dashboard/membership" className="btn btn-light mt-5">
              {a.join.cta}
            </Link>
          </section>
        )}

        <h2 className="font-serif text-[0.9375rem] tracking-[0.28em] text-tika uppercase">{a.forYou}</h2>
        <ul className="mt-5 grid grid-cols-6 gap-3">
          {a.tiles.map((tile, i) => (
            <li key={tile.key} className={i < 3 ? "col-span-2" : "col-span-3"}>
              <Link
                href={member ? `/app/concierge?c=${encodeURIComponent(tile.category)}` : viewer ? "/dashboard/membership" : "/app/account"}
                className="group flex h-full flex-col overflow-hidden border border-line bg-paper/60 transition-colors hover:border-ink"
              >
                <div className={`app-tile-art relative grid place-items-center ${i < 3 ? "aspect-square" : "aspect-[16/9]"}`}>
                  {tile.deva ? (
                    <span lang="ne" className="font-deva text-[1.75rem] text-gold/90">
                      {tile.deva}
                    </span>
                  ) : (
                    <svg viewBox="0 0 48 48" className="h-8 w-8 text-gold/90" fill="none" aria-hidden="true">
                      <path d={LOGO_PATH} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase">{tile.title}</h3>
                  <p className="mt-1.5 flex-1 text-[0.75rem] leading-snug text-mute">{tile.body}</p>
                  <span className="mt-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-tika uppercase">
                    {a.explore} <span aria-hidden="true">›</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-serif text-[0.9375rem] tracking-[0.28em] text-tika uppercase">{a.radar}</h2>
        <details className="group mt-5 bg-ink text-ivory">
          <summary className="flex cursor-pointer list-none gap-4 p-5 [&::-webkit-details-marker]:hidden">
            <span className="app-tile-art grid h-20 w-20 shrink-0 place-items-center">
              <svg viewBox="0 0 48 48" className="h-8 w-8 text-gold" fill="none" aria-hidden="true">
                <path d={LOGO_PATH} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[0.75rem] font-semibold tracking-[0.14em] uppercase">{e.name}</span>
              <span className="mt-1 block text-sm opacity-80">{issueDrop.venue}</span>
              <span className="mt-3 inline-block text-[0.6875rem] font-semibold tracking-[0.16em] text-gold uppercase">
                <span className="group-open:hidden">{a.viewEvent} ›</span>
                <span className="hidden group-open:inline">{a.hideEvent}</span>
              </span>
            </span>
          </summary>
          <div className="border-t border-ivory/15 px-5 pt-4 pb-5">
            <p className="opacity-85">{e.body}</p>
            <p className="mt-3 text-sm tracking-[0.12em] uppercase opacity-70">
              {issueDrop.reserved === null ? e.seatsSoon(issueDrop.seats) : e.seatsOf(Math.min(issueDrop.reserved, issueDrop.seats), issueDrop.seats)}
            </p>
            <div className="mt-4">
              {member ? (
                <Link href={`/app/concierge?c=${encodeURIComponent("Experiences")}`} className="btn btn-light btn-sm">
                  {copy.app.concierge.submit}
                </Link>
              ) : (
                <InquiryButton className="btn btn-light btn-sm">{e.cta}</InquiryButton>
              )}
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
