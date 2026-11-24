"use client";

import { useEffect, useState } from "react";

// Chrome's install event; not in the DOM typings yet.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Install the app" button. It only appears when the browser says the site can be
 * installed (Chrome on Android and desktop), and never inside the installed app.
 */
export function InstallApp({ className = "" }: { className?: string }) {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const onPrompt = (e: Event) => {
      e.preventDefault(); // show our own button instead of the browser's mini bar
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await event.prompt();
        await event.userChoice;
        setEvent(null); // the event can only be used once
      }}
    >
      Install the app
    </button>
  );
}
