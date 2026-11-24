import Link from "next/link";
import { formatDate } from "@/components/ArticleCard";
import { AppHeader } from "@/components/AppHeader";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { InstallApp } from "@/components/InstallApp";
import { site } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";
import { memberNumber } from "@/lib/app";

export const metadata = { title: "Account" };

/** Profile, membership status and the links that live on the website. */
export default async function AccountPage() {
  const viewer = await getViewer();
  const t = copy.app.account;
  const number = await memberNumber(viewer);

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
