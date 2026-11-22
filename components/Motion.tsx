"use client";

import { useEffect, useRef, useState } from "react";

// The wordmark gradient from globals.css (.wordmark-gradient), as [position, r, g, b].
const WORDMARK_STOPS = [
  [0, 0x3b, 0x1a, 0x12],
  [0.35, 0x6b, 0x3a, 0x10],
  [0.65, 0xa0, 0x6a, 0x18],
  [1, 0xc8, 0x96, 0x2a],
] as const;

function gradientAt(t: number) {
  const hi = WORDMARK_STOPS.findIndex((s) => s[0] >= t);
  const b = WORDMARK_STOPS[Math.max(hi, 1)];
  const a = WORDMARK_STOPS[Math.max(hi, 1) - 1];
  const k = (t - a[0]) / (b[0] - a[0]);
  const mix = (j: 1 | 2 | 3) => Math.round(a[j] + (b[j] - a[j]) * k);
  return `rgb(${mix(1)} ${mix(2)} ${mix(3)})`;
}

const prefersReducedMotion =() => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fades its children up the first time they scroll into view. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds, for staggering items in a row. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      el.dataset.shown = "";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.shown = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/**
 * The hero's giant AUTHORITY. Letters rise in on load; on scroll the word drifts up,
 * widens and fades. Progress is written to a CSS variable (--p) once per frame.
 */
export function ScrollWordmark({ word, className = "" }: { word: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.8)));
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const letters = [...word];
  return (
    <h1 ref={ref} aria-label={word} className={`hero-word ${className}`}>
      {letters.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="hero-letter"
          // Each letter takes its colour from the wordmark gradient (brown → gold); a
          // background-clip gradient on the parent does not paint transformed children.
          style={{ "--i": i, color: gradientAt(letters.length > 1 ? i / (letters.length - 1) : 0) } as React.CSSProperties}
        >
          {ch}
        </span>
      ))}
    </h1>
  );
}

/** Counts 000 → 100 while the intro curtain is up. */
export function IntroCounter({ duration = 2200 }: { duration?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease out, so the count slows as it reaches 100.
      setN(Math.round(100 * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return <span>{String(n).padStart(3, "0")}</span>;
}
