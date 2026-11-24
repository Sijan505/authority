import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { LOGO_PATH } from "@/components/Decor";
import { copy } from "@/content/copy";
import { memberNumberOf } from "@/lib/app";
import { db } from "@/lib/db";
import { activeMemberWhere } from "@/lib/social";

export const metadata: Metadata = { title: "Membership check", robots: { index: false, follow: false } };

const fullDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kathmandu" });

/**
 * Opened by scanning a membership card's QR code, e.g. by staff at a partner venue.
 * Shows who the card belongs to and whether the membership is active right now.
 * The code is long and random, and the page is never indexed.
 */
export default async function VerifyPage({ params }: PageProps<"/verify/[code]">) {
  const { code } = await params;
  const t = copy.app.verify;
  const user =
    code.length >= 12 && code.length <= 40
      ? await db.user.findUnique({ where: { memberCode: code }, select: { id: true, name: true, image: true, photoUpdatedAt: true, status: true, field: { select: { name: true } } } })
      : null;

  const now = new Date();
  const active = user ? (await db.user.count({ where: { id: user.id, ...activeMemberWhere() } })) > 0 : false;
  const [sub, number] =
    user && active
      ? await Promise.all([
          db.subscription.findFirst({
            where: { userId: user.id, package: "PRO", status: "ACTIVE", startsAt: { lte: now }, expiresAt: { gt: now } },
            orderBy: { expiresAt: "desc" },
            select: { expiresAt: true },
          }),
          memberNumberOf(user.id),
        ])
      : [null, null];
  // The photo URL carries the card code, so staff can see it without signing in.
  const photo = user?.photoUpdatedAt ? `/api/photo/${user.id}?v=${user.photoUpdatedAt.getTime()}&code=${encodeURIComponent(code)}` : (user?.image ?? null);

  return (
    <main className="grid min-h-[calc(100svh-8rem)] place-items-center px-5 py-12">
      <div className="w-full max-w-sm text-center">
        <svg viewBox="0 0 48 48" className="mx-auto h-10 w-10 text-tika" fill="none" aria-hidden="true">
          <path d={LOGO_PATH} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <p className="mt-3 text-xs tracking-[0.3em] text-mute uppercase">{t.label}</p>

        {!user ? (
          <p className="mt-8 border border-ink p-6">{t.unknown}</p>
        ) : (
          <div className={`mt-8 border-2 p-7 ${active ? "border-gold bg-paper/60" : "border-ink/30"}`}>
            <div className="flex justify-center">
              <Avatar name={user.name} image={photo} size={120} />
            </div>
            <h1 className="mt-5 font-serif text-[2rem] leading-tight font-light">{user.name}</h1>
            {user.field && <p className="mt-1 text-mute">{user.field.name}</p>}
            <p className={`mt-6 inline-block px-4 py-2 text-sm font-semibold tracking-[0.18em] uppercase ${active ? "bg-ink text-gold" : "border border-error text-error"}`}>
              {active ? `✓ ${t.active}` : t.inactive}
            </p>
            {active && (
              <p className="mt-4 text-sm text-mute">
                {number && <span className="text-tika">{copy.app.memberNo(number)}</span>}
                {number && sub?.expiresAt && " · "}
                {sub?.expiresAt && (
                  <>
                    {t.validUntil} {fullDate(sub.expiresAt)}
                  </>
                )}
              </p>
            )}
            <p className="mt-6 text-xs text-mute">
              {t.checked} {now.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kathmandu" })}
            </p>
          </div>
        )}
        <p className="mt-6 text-sm text-mute">{t.note}</p>
      </div>
    </main>
  );
}
