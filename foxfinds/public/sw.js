// Fox Finds service worker.
// Deliberately a network pass-through: it makes the app installable without
// caching pages, so you never see a stale version after deploying.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // No respondWith → the browser handles the request normally (straight to network).
});
