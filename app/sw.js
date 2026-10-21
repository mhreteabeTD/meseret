/* Meseret service worker: cache the shell on install, cache chapters and lessons as they are opened, serve cached when offline. */
const V = 'meseret-v3';
const SHELL = ['./', './index.html', './app.js', './styles.css', './manifest.webmanifest', './icon.svg', './i18n/en.json', './i18n/am.json', './chapter-shell.js', './chapter-shell.css'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin) { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); return; }
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok) caches.open(V).then(c => c.put(e.request, res.clone())); return res; }).catch(() => hit);
    return hit ? (u.pathname.endsWith('.json') || u.pathname.endsWith('.html') ? net.catch(() => hit) : hit) : net;
  }));
});
