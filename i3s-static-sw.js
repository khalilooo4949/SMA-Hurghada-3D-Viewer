/* SMA I3S viewer: service worker at website root, model assets under /model/. */
const ROOT = new URL('./model/', self.registration.scope);
const PREFIX = new URL('SceneServer/layers/0', ROOT).pathname;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  let p = decodeURIComponent(url.pathname);
  if (p !== PREFIX && !p.startsWith(PREFIX + '/')) return;
  event.respondWith((async () => {
    let sub = p.slice(PREFIX.length).replace(/^\/+/, '');
    while (sub.startsWith('layers/0/')) sub = sub.slice(9);
    if (!sub) sub = '3dSceneLayer.json';
    else if (sub.startsWith('nodepages/') && !sub.endsWith('.json')) sub += '.json';
    else if (sub.startsWith('nodes/')) {
      const parts = sub.split('/');
      if (parts.length === 2) sub += '/3dNodeIndexDocument.json';
      else if (sub.includes('/geometries/') && !/\.(bin|gz)$/.test(sub)) sub += '.bin';
      else if (sub.includes('/textures/') && !/\.(jpg|png)$/.test(sub)) sub += '.jpg';
      else if ((sub.includes('/features/') || sub.includes('/shared/')) && !sub.endsWith('.json')) sub += '.json';
    }
    if (sub.includes('..')) return new Response('Bad path', {status:400});
    const target = new URL(sub, ROOT);
    const response = await fetch(target);
    if (!response.ok) console.warn('[SMA I3S] Missing', url.pathname, '=>', target.pathname, response.status);
    return response;
  })());
});
