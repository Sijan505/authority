"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { registerServiceWorker } from "@/components/PushToggle";
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
  members: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M15.5 6.2a3 3 0 0 1 0 5.6M17.5 14.8c1.6.6 2.6 2 3 4.2" />
    </>
  ),
  messages: <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" />,
  account: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
};

const tabs = [
  { key: "home", href: "/app", label: t.home },
  { key: "members", href: "/app/members", label: t.members },
  { key: "messages", href: "/app/messages", label: t.messages },
  { key: "concierge", href: "/app/concierge", label: t.concierge },
  { key: "account", href: "/app/account", label: t.account },
];

type Badges = { messages: number; requests: number; notifications: number };

/**
 * The app's bottom tab bar. It shows on /app pages, and on every page when the site
 * runs as the installed app, so members can always get back to the dashboard.
 */
export function AppTabBar() {
  const pathname = usePathname();
  const [standalone, setStandalone] = useState(false);
  const [badges, setBadges] = useState<Badges>({ messages: 0, requests: 0, notifications: 0 });
  const inApp = pathname === "/app" || pathname.startsWith("/app/");
  const shown = (inApp || standalone) && !pathname.startsWith("/admin");

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const update = () => setStandalone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Badge counts: on each screen change, when the app comes back, and every 30 seconds.
  useEffect(() => {
    if (!shown) return;
    registerServiceWorker();
    let alive = true;
    const load = () =>
      fetch("/api/app/badges", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((b: Badges | null) => alive && b && setBadges(b))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 30_000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [shown, pathname]);

  const count: Record<string, number> = { members: badges.requests, messages: badges.messages };
  if (!shown) return null;

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
                {count[tab.key] > 0 && (
                  <span className="absolute top-2 left-[calc(50%+6px)] grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.5625rem] font-semibold tracking-normal text-ink">
                    {count[tab.key] > 9 ? "9+" : count[tab.key]}
                    <span className="sr-only"> new</span>
                  </span>
                )}
                {active && <span className="absolute inset-x-5 bottom-1.5 h-px bg-gold" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
