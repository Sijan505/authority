import Link from "next/link";
import { FieldTheme } from "@/components/FieldTheme";
import { copy } from "@/content/copy";
import { requireOnboarded } from "@/lib/access";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const viewer = await requireOnboarded();
  const t = copy.dashboard;
  const links = [
    { href: "/dashboard", label: t.home },
    { href: "/dashboard/membership", label: t.membership },
    // Members only.
    ...(viewer.plan === "PRO"
      ? [
          { href: "/dashboard/discussion", label: t.discussion },
          { href: "/dashboard/directory", label: t.directory },
        ]
      : []),
  ];

  return (
    <FieldTheme slug={viewer.user.field?.slug}>
      <div className="border-b border-gold/30">
        <nav aria-label="Member" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <span className="text-sm uppercase tracking-[0.2em] accent-text">{viewer.user.field?.name}</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
          <span className="ml-auto text-sm">
            {t.plan}: <strong className="text-brown">{viewer.plan === "PRO" ? t.member : t.notMember}</strong>
          </span>
        </nav>
      </div>
      {children}
    </FieldTheme>
  );
}
