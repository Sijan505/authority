import Link from "next/link";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { Star } from "@/components/Decor";
import { InquiryButton } from "@/components/Inquiry";
import { InstallApp } from "@/components/InstallApp";
import { MobileMenu } from "@/components/MobileMenu";
import { site } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

const publicLinks = [
  { href: "/platform", label: copy.nav.platform },
  { href: "/#divisions", label: copy.nav.divisions },
  { href: "/articles", label: copy.nav.articles },
  { href: "/#membership", label: copy.nav.membership },
  { href: "/founder-circle", label: copy.nav.founderCircle },
  { href: "/about", label: copy.nav.about },
  { href: "/#faq", label: copy.nav.faq },
];

export async function SiteHeader() {
  const viewer = await getViewer();
  const account = viewer ? (
    <>
      <Link href="/dashboard" className="nav-link text-ink">
        {copy.nav.dashboard}
      </Link>
      {viewer.isAdmin && (
        <Link href="/admin" className="nav-link">
          {copy.nav.admin}
        </Link>
      )}
      <SignOutButton className="nav-link text-left" />
    </>
  ) : (
    <>
      <InquiryButton className="nav-link text-ink">{copy.inquiry.cta}</InquiryButton>
      <SignInButton label={copy.nav.signIn} className="btn btn-sm" />
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5" aria-label="Authority home">
          <Star className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="wordmark-gradient font-serif text-lg tracking-[0.22em] min-[380px]:text-xl min-[380px]:tracking-[0.32em]">{copy.brand.wordmark}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-5 xl:flex">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-line" aria-hidden="true" />
          {account}
        </nav>

        <MobileMenu label={copy.nav.menu}>
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col">{account}</div>
          <InstallApp className="btn btn-alt" />
        </MobileMenu>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line py-12 text-[0.9375rem] text-mute">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-6 px-6">
        <span className="flex items-center gap-2.5">
          <Star className="h-5 w-5" />
          <span>
            <span className="tracking-[0.2em] text-ink">{copy.brand.wordmark}</span>. {copy.brand.tagline}
          </span>
        </span>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center sm:[&_a]:min-h-0">
          <li>
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {site.instagramHandle}
            </a>
          </li>
          <li>
            <Link href="/contact" className="hover:text-ink">
              {copy.home.join.contact}
            </Link>
          </li>
          <li>
            <InstallApp className="inline-flex min-h-11 items-center hover:text-ink sm:min-h-0" />
          </li>
          <li>
            <Link href="/privacy" className="hover:text-ink">
              {copy.footer.privacy}
            </Link>
          </li>
          <li>
            <span>{copy.footer.rights}</span>
          </li>
          <li>
            <Link href="/admin-login" className="hover:text-ink" rel="nofollow">
              Admin
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
