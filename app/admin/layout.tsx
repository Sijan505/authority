import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/content/copy";
import { requireAdmin } from "@/lib/access";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const n = copy.admin.nav;
  const links = [
    ["/admin", n.dashboard],
    ["/admin/inquiries", n.inquiries],
    ["/admin/payments", n.payments],
    ["/admin/articles", n.articles],
    ["/admin/offers", n.offers],
    ["/admin/members", n.members],
    ["/admin/moderation", n.moderation],
  ];
  return (
    <div>
      <div className="border-b border-gold/30 bg-paper">
        <nav aria-label="Admin" className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <span className="text-sm uppercase tracking-[0.2em] text-gold-dark">Admin</span>
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
