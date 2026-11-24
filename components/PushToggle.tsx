"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/actions/social";
import { copy } from "@/content/copy";

const t = copy.social.push;
const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** The VAPID public key as the bytes pushManager.subscribe expects. */
function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Registers the service worker once, wherever the app runs. */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => null);
}

type State = "loading" | "unsupported" | "denied" | "off" | "on";

/** "Turn on notifications" for this phone, with the current state. */
export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await registerServiceWorker();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const reg = await registerServiceWorker();
      if (!reg) return setState("unsupported");
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) }));
      const res = await savePushSubscription(sub.toJSON());
      setState(res.ok ? "on" : "off");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") return null;
  return (
    <section className="border border-ink p-5">
      <h2 className="font-serif text-[1.25rem] font-light">{t.heading}</h2>
      <p className="mt-1 text-sm text-mute">{state === "on" ? t.enabled : state === "denied" ? t.denied : state === "unsupported" ? t.unsupported : t.body}</p>
      {state === "off" && (
        <button type="button" onClick={turnOn} disabled={busy} className="btn mt-4 w-full">
          {t.on}
        </button>
      )}
      {state === "on" && (
        <button type="button" onClick={turnOff} disabled={busy} className="btn btn-alt mt-4 w-full">
          {t.off}
        </button>
      )}
    </section>
  );
}
