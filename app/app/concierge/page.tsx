import Link from "next/link";
import { formatDate } from "@/components/ArticleCard";
import { AppHeader } from "@/components/AppHeader";
import { SignInButton } from "@/components/AuthButtons";
import { conciergeCategories } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { db } from "@/lib/db";
import { ConciergeForm } from "./ConciergeForm";

export const metadata = { title: "Concierge" };

const tone: Record<string, string> = {
  NEW: "border-ink/30 text-mute",
  IN_PROGRESS: "border-tika text-tika",
  DONE: "border-ink bg-ink text-ivory",
  DECLINED: "border-ink/30 text-mute line-through decoration-1",
};

/** The Request Desk: members send a request; the team's reply and status show below. */
export default async function ConciergePage({ searchParams }: PageProps<"/app/concierge">) {
  const viewer = await getViewer();
  const t = copy.app.concierge;
  const member = viewer?.plan === "PRO";
  const { c } = await searchParams;
  const initial = conciergeCategories.find((x) => x === c) ?? conciergeCategories[0];

  const requests = member
    ? await db.conciergeRequest.findMany({ where: { userId: viewer!.user.id }, orderBy: { createdAt: "desc" }, take: 30 })
    : [];

  return (
    <main>
      <AppHeader label={t.eyebrow} title={t.heading}>
        <ul className="mt-4 space-y-1 font-serif text-[1.0625rem] italic text-gold/90">
          {t.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </AppHeader>

      <div className="mx-auto max-w-xl px-5 pt-8 pb-10">
        <p className="text-mute">{t.intro}</p>

        {member ? (
          <div className="mt-8">
            <ConciergeForm key={initial} initialCategory={initial} />
          </div>
        ) : (
          <div className="mt-8 bg-ink p-6 text-ivory">
            <p className="opacity-85">{t.locked}</p>
            <div className="mt-5">
              {viewer ? (
                <Link href="/dashboard/membership" className="btn btn-light">
                  {copy.app.join.cta}
                </Link>
              ) : (
                <SignInButton label={copy.app.guest.signIn} callbackUrl="/app/concierge" className="btn btn-light" />
              )}
            </div>
          </div>
        )}

        {member && (
          <section id="requests" aria-labelledby="requests-h" className="mt-12 scroll-mt-6">
            <h2 id="requests-h" className="font-serif text-[0.9375rem] tracking-[0.28em] text-tika uppercase">
              {t.yours}
            </h2>
            {requests.length === 0 ? (
              <p className="mt-4 text-mute">{t.none}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {requests.map((r) => (
                  <li key={r.id} className="py-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.75rem] font-semibold tracking-[0.14em] uppercase">{r.category}</span>
                      <span className={`border px-2 py-0.5 text-[0.6875rem] tracking-[0.1em] uppercase ${tone[r.status]}`}>{t.status[r.status]}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line">{r.details}</p>
                    <p className="mt-1 text-sm text-mute">
                      {[r.city, r.date, r.people ? `${r.people} ${r.people === 1 ? "person" : "people"}` : null, formatDate(r.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                    {r.reply && (
                      <div className="mt-3 border-l-2 border-gold bg-paper/60 px-4 py-3">
                        <p className="text-[0.6875rem] font-semibold tracking-[0.2em] text-tika uppercase">{t.reply}</p>
                        <p className="mt-1 whitespace-pre-line">{r.reply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
