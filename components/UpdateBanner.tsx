"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/content/copy";

/**
 * The installed app always loads the live site, so a deploy reaches everyone the next
 * time they open it; nobody reinstalls. For someone who has it open during a deploy,
 * this bar appears and one tap reloads into the new version.
 */
export function UpdateBanner({ version }: { version: string }) {
  const pathname = usePathname();
  const [stale, setStale] = useState(false);
  const inApp = pathname === "/app" || pathname.startsWith("/app/");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (version === "dev" || (!inApp && !standalone)) return;
    const check = () =>
      fetch("/api/version", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { id: string } | null) => d && d.id !== "dev" && d.id !== version && setStale(true))
        .catch(() => {});
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(check, 5 * 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, [version, inApp]);

  if (!stale) return null;
  return (
    <div role="status" className="app-update fixed inset-x-3 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 bg-gold px-4 py-3 text-ink shadow-xl">
      <span className="text-sm font-medium">{copy.app.update.ready}</span>
      <button type="button" onClick={() => window.location.reload()} className="btn btn-sm shrink-0">
        {copy.app.update.refresh}
      </button>
    </div>
  );
}
