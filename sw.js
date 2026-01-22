
const CACHE_NAME = 'drivers-friend-v17-core';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/lucide-react@0.469.0',
  'https://cdn-icons-png.flaticon.com/512/2555/2555013.png'
];

// Instalação: Cacheia arquivos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Cacheando recursos críticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch: Cache Falling Back to Network
self.addEventListener('fetch', (event) => {
  // Ignora requisições de outras origens se necessário, 
  // mas para PWA 44/44 queremos cachear tudo que for possível.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Opcional: Cacheia novas requisições dinamicamente
        if (event.request.method === 'GET') {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback offline para a página inicial
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
