const CACHE = 'bl-v1';

// Fichiers à mettre en cache
const STATIC = [
  '/Simplycab-/',
  '/Simplycab-/index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Installation — mise en cache des ressources statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(STATIC.map(url => c.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage ancien cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — stratégie Network First pour Firebase, Cache First pour statiques
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase — toujours réseau (pas de cache)
  if(url.includes('firebasedatabase') || url.includes('twilio') || url.includes('onesignal')) {
    return;
  }

  // Stratégie: réseau d'abord, cache en fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Mettre en cache si OK
        if(res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', e => {
  if(e.data === 'skipWaiting') self.skipWaiting();
});
