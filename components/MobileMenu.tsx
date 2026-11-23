"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * The small-screen menu: a native <details>, so it opens and works without JS. With JS
 * it also closes when a link inside is tapped (including same-page #anchors, which
 * don't change the route), on a tap outside, on Escape and after any navigation.
 */
export function MobileMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = () => ref.current && (ref.current.open = false);
    const onDown = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="mobile-menu xl:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 border border-line px-3 text-[0.9375rem] sm:px-4 [&::-webkit-details-marker]:hidden">
        <span className="mobile-menu-icon" aria-hidden="true" />
        {label}
      </summary>
      <nav
        aria-label="Menu"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button") && ref.current) ref.current.open = false;
        }}
        className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto overscroll-contain border-t border-line bg-ivory px-4 pt-2 pb-10 sm:px-6"
      >
        {children}
      </nav>
    </details>
  );
}
