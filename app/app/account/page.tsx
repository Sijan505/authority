import Link from "next/link";
import { formatDate } from "@/components/ArticleCard";
import { AppHeader } from "@/components/AppHeader";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { InstallApp } from "@/components/InstallApp";
import { MemberCard } from "@/components/MemberCard";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PushToggle } from "@/components/PushToggle";
import { site } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { memberNumber } from "@/lib/app";
import { cardFor } from "@/lib/member-card";
import { photoUrl } from "@/lib/photo";

export const metadata = { title: "Account" };

/** Profile, membership status and the links that live on the website. */
export default async function AccountPage() {
  const viewer = await getViewer();
  const t = copy.app.account;
  const [number, card] = await Promise.all([memberNumber(viewer), cardFor(viewer)]);
  const a = copy.app;

  const links = [
    { href: "/dashboard/membership", label: t.links.membership, show: !!viewer },
    { href: "/dashboard", label: t.links.field, show: !!viewer },
    { href: `mailto:${site.contactEmail}`, label: t.links.contact, show: true },
    { href: "/privacy", label: t.links.privacy, show: true },
    { href: "/", label: t.links.website, show: true },
  ].filter((l) => l.show);

  return (
    <main>
      <AppHeader label={t.heading} title={viewer?.user.name ?? copy.app.guest.heading} />
      <div className="mx-auto max-w-xl px-5 pt-8 pb-10">
        {viewer && card && (
          <section id="card" aria-labelledby="card-h" className="mb-10 scroll-mt-6">
            <h2 id="card-h" className="mb-4 font-serif text-[0.9375rem] tracking-[0.28em] text-tika uppercase">
              {a.card.heading}
            </h2>
            <MemberCard card={card} />
            {card.qr && (
              // A large copy of the QR, easy for a venue to scan off the screen.
              <div
                className="card-qr mx-auto mt-6 h-56 w-56 rounded-xl bg-white p-4 shadow-[inset_0_0_0_1px_rgba(200,150,42,0.35)]"
                role="img"
                aria-label={a.card.qrLabel}
                dangerouslySetInnerHTML={{ __html: card.qr }}
              />
            )}
            <p className="mt-3 text-center text-sm text-mute">{card.qr ? a.card.hint : a.card.notMember}</p>
          </section>
        )}
        {viewer && (
          <section aria-labelledby="photo-h" className="mb-10">
            <h2 id="photo-h" className="mb-4 font-serif text-[0.9375rem] tracking-[0.28em] text-tika uppercase">
              {a.photo.heading}
            </h2>
            <PhotoUpload name={viewer.user.name} current={photoUrl(viewer.user)} hasUploaded={!!viewer.user.photoUpdatedAt} />
          </section>
        )}
        {viewer ? (
          <dl className="grid grid-cols-[8rem_1fr] gap-y-3 border-y border-line py-5">
            <dt className="text-sm text-mute">{t.field}</dt>
            <dd>{viewer.user.field?.name ?? "—"}</dd>
            <dt className="text-sm text-mute">{t.membership}</dt>
            <dd>
              {viewer.plan === "PRO" ? copy.app.tierMember : t.none}
              {number && <span className="ml-2 text-sm text-tika">{copy.app.memberNo(number)}</span>}
            </dd>
            {viewer.proExpiresAt && (
              <>
                <dt className="text-sm text-mute">{t.expires}</dt>
                <dd>{formatDate(viewer.proExpiresAt)}</dd>
              </>
            )}
            <dt className="text-sm text-mute">Email</dt>
            <dd className="break-all">{viewer.user.email}</dd>
          </dl>
        ) : (
          <div className="border border-ink p-6">
            <p>{t.signedOut}</p>
            <SignInButton label={copy.app.guest.signIn} callbackUrl="/app" className="btn mt-4" />
          </div>
        )}

        {viewer && (
          <div className="mt-8">
            <PushToggle />
          </div>
        )}

        <ul className="mt-8 border-t border-line">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-14 items-center justify-between border-b border-line font-serif text-[1.25rem] font-light">
                {l.label} <span className="text-mute" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <InstallApp className="btn btn-alt w-full" />
          {viewer && <SignOutButton className="btn btn-alt w-full" callbackUrl="/app" />}
        </div>
      </div>
    </main>
  );
}
