// Authority service worker: shows push notifications and opens the right screen when
// one is tapped. It deliberately has no fetch handler, so it never caches or changes
// how pages load.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Authority";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      // Large icon: the Authority star on ivory. Badge: the small status-bar icon,
      // which Android draws as a white silhouette, so it is a transparent outline.
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      timestamp: data.timestamp || Date.now(),
      vibrate: [60, 40, 60],
      lang: "en",
      data: { url: data.url || "/app" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/app", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Reuse an open Authority window if there is one.
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
