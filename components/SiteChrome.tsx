import Link from "next/link";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { Star } from "@/components/Decor";
import { InquiryButton } from "@/components/Inquiry";
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
    <header className="sticky top-0 z-30 border-b border-line bg-ivory">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Authority home">
          <Star className="h-6 w-6" />
          <span className="wordmark-gradient font-serif text-xl tracking-[0.32em]">{copy.brand.wordmark}</span>
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

        {/* Mobile menu: native <details>, keyboard accessible without JS */}
        <details className="relative xl:hidden">
          <summary className="cursor-pointer list-none border border-line px-3 py-1 text-[0.9375rem] [&::-webkit-details-marker]:hidden">
            {copy.nav.menu}
          </summary>
          <nav aria-label="Main" className="absolute right-0 z-20 mt-2 flex w-60 flex-col gap-3 border border-line bg-ivory p-5">
            {publicLinks.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link">
                {l.label}
              </Link>
            ))}
            <hr className="border-line" />
            {account}
          </nav>
        </details>
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
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
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
