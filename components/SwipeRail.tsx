"use client";

import { Children, useRef, useState } from "react";

/**
 * A row of cards you swipe sideways, snapping one card at a time, with dots that show
 * (and jump to) the current card. Works with touch, trackpads and the keyboard.
 */
export function SwipeRail({ label, children }: { label: string; children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const count = Children.count(children);

  const cardStep = () => {
    const el = rail.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return 1;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    return first.offsetWidth + gap;
  };

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    setCurrent(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / cardStep()))));
  };

  const go = (i: number) => rail.current?.scrollTo({ left: i * cardStep(), behavior: "smooth" });

  return (
    <div>
      <div
        ref={rail}
        onScroll={onScroll}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="swipe-rail -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 outline-none"
      >
        {children}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-tika" : "w-1.5 bg-ink/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
