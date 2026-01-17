// Service Worker for HabitSync PWA

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `habitsync-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `habitsync-dynamic-${CACHE_VERSION}`;

// Assets to precache during install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('habitsync-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Helper to determine if request should be cached
function shouldCache(request) {
  const url = new URL(request.url);

  // Don't cache API requests
  if (url.pathname.startsWith('/api/')) {
    return false;
  }

  // Don't cache config.js (it's dynamic)
  if (url.pathname === '/config.js') {
    return false;
  }

  // Don't cache authentication-related URLs
  if (url.pathname.includes('/auth') || url.pathname.includes('/oauth')) {
    return false;
  }

  // Cache static assets and app shell
  return true;
}

// Fetch event - implement stale-while-revalidate for most assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests except for fonts and images
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAllowedCrossOrigin = url.hostname.includes('fonts.googleapis.com') ||
                                url.hostname.includes('fonts.gstatic.com');

  if (!isSameOrigin && !isAllowedCrossOrigin) {
    return;
  }

  if (!shouldCache(request)) {
    // For non-cacheable requests, try network first, then fail gracefully
    event.respondWith(
      fetch(request).catch(() => {
        // Return a minimal fallback for config.js
        if (url.pathname === '/config.js') {
          return new Response('window.APP_CONFIG = {};', {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Stale-while-revalidate strategy for cacheable requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch((err) => {
            console.log('[SW] Network request failed:', err);
            return null;
          });

        return cachedResponse || fetchPromise;
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});