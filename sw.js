const CACHE_NAME = 'drivers-friend-pro-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/metadata.json',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/lucide-react@0.469.0'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});