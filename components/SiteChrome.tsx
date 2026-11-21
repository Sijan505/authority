import Link from "next/link";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { Star } from "@/components/Decor";
import { site } from "@/config/site";
import { copy } from "@/content/copy";
import { getViewer } from "@/lib/access";

const publicLinks = [
  { href: "/articles", label: copy.nav.articles },
  { href: "/membership", label: copy.nav.membership },
  { href: "/about", label: copy.nav.about },
  { href: "/faq", label: copy.nav.faq },
];

export async function SiteHeader() {
  const viewer = await getViewer();
  const account = viewer ? (
    <>
      <Link href="/dashboard" className="nav-link">
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
    <SignInButton label={copy.nav.signIn} className="btn btn-sm" />
  );

  return (
    <header className="border-b border-gold/30 bg-ivory">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Authority home">
          <Star className="h-5 w-5" />
          <span className="text-xl font-semibold tracking-[0.2em] text-brown">{copy.brand.wordmark}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {publicLinks.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
          <span className="h-5 w-px bg-gold/40" aria-hidden="true" />
          {account}
        </nav>

        {/* Mobile menu: native <details>, keyboard accessible without JS */}
        <details className="relative md:hidden">
          <summary className="nav-link cursor-pointer list-none rounded border border-gold/40 px-3 py-1 [&::-webkit-details-marker]:hidden">
            {copy.nav.menu}
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-3 border border-gold/30 bg-ivory p-4"
          >
            {publicLinks.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link">
                {l.label}
              </Link>
            ))}
            <hr className="border-gold/30" />
            {account}
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gold/30 px-4 py-10 text-center sm:px-6">
      <Star className="mx-auto h-6 w-6" />
      <p className="mt-2 text-xl font-semibold tracking-[0.2em] text-brown">{copy.brand.wordmark}</p>
      <p className="gold-text italic">{copy.brand.tagline}</p>
      <ul className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
        <li>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="link">
            {site.instagramHandle}
          </a>
        </li>
        <li>
          <Link href="/contact" className="link">
            {copy.nav.contact}
          </Link>
        </li>
        <li>
          <Link href="/privacy" className="link">
            {copy.footer.privacy}
          </Link>
        </li>
      </ul>
      <p className="mt-6 text-sm">{copy.footer.rights}</p>
    </footer>
  );
}
