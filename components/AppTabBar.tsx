"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/content/copy";

const t = copy.app.tabs;

// Simple line icons, drawn at 24×24 with currentColor.
const icons: Record<string, React.ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V20h-5v-5.5H9V20H4z" />,
  discover: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  concierge: (
    <>
      <path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 8V6.5M10.5 6.5h3" />
      <path d="M3.5 20h17" />
    </>
  ),
  forum: <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" />,
  account: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
};

const tabs = [
  { key: "home", href: "/app", label: t.home },
  { key: "discover", href: "/app/discover", label: t.discover },
  { key: "concierge", href: "/app/concierge", label: t.concierge },
  { key: "forum", href: "/app/forum", label: t.forum },
  { key: "account", href: "/app/account", label: t.account },
];

/**
 * The app's bottom tab bar. It shows on /app pages, and on every page when the site
 * runs as the installed app, so members can always get back to the dashboard.
 */
export function AppTabBar() {
  const pathname = usePathname();
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const update = () => setStandalone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const inApp = pathname === "/app" || pathname.startsWith("/app/");
  if (!inApp && !standalone) return null;
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav aria-label="App" className="app-tabbar fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-ink text-ivory">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {tabs.map((tab) => {
          const active = tab.href === "/app" ? pathname === "/app" : pathname.startsWith(tab.href);
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.625rem] tracking-[0.14em] uppercase transition-colors ${
                  active ? "text-gold" : "text-ivory/65 hover:text-ivory"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {icons[tab.key]}
                </svg>
                {tab.label}
                {active && <span className="absolute inset-x-5 bottom-1.5 h-px bg-gold" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
