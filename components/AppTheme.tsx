"use client";

import { useEffect, useSyncExternalStore } from "react";
import { copy } from "@/content/copy";
import { THEME_COLORS, THEME_KEY } from "@/lib/app-theme";

type Choice = "light" | "dark" | "auto";

function apply(choice: Choice) {
  const dark = choice === "dark" || (choice === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.appTheme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

function readChoice(): Choice {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "auto" ? v : "light";
  } catch {
    return "light";
  }
}

// The saved choice lives in localStorage; this lets React read it without a
// mismatch between the server render (always "light") and the phone.
const CHANGE = "authority:theme";
const subscribe = (cb: () => void) => {
  window.addEventListener(CHANGE, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Light / Dark / Match phone, in Account. */
export function ThemeSwitch() {
  const t = copy.app.theme;
  const choice = useSyncExternalStore(subscribe, readChoice, () => "light" as Choice);

  // Keep "Match phone" in step when the phone switches between light and dark.
  useEffect(() => {
    apply(choice);
    if (choice !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("auto");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const pick = (c: Choice) => {
    try {
      window.localStorage.setItem(THEME_KEY, c);
    } catch {}
    window.dispatchEvent(new Event(CHANGE));
    apply(c);
  };

  const options: { value: Choice; label: string }[] = [
    { value: "light", label: t.light },
    { value: "dark", label: t.dark },
    { value: "auto", label: t.auto },
  ];

  return (
    <fieldset>
      <legend className="sr-only">{t.heading}</legend>
      <div className="grid grid-cols-3 border border-ink/25">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-11 cursor-pointer items-center justify-center border-r border-ink/25 text-sm last:border-r-0 ${choice === o.value ? "bg-ink text-ivory" : "hover:bg-gold-pale/40"}`}
          >
            <input type="radio" name="app-theme" value={o.value} checked={choice === o.value} onChange={() => pick(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
