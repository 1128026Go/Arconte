const CACHE_NAME = 'arconte-v1.0.0';
const OFFLINE_CACHE = 'arconte-offline-v1';

// Assets críticos para cache inmediato
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/logo.svg',
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  API: 'network-first',        // APIs: red primero, cache fallback
  STATIC: 'cache-first',       // Assets estáticos: cache primero
  DYNAMIC: 'stale-while-revalidate' // Contenido dinámico: cache + actualización en background
};

// Install event - cachear assets críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching critical assets');
      return cache.addAll(CRITICAL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - limpiar caches antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== OFFLINE_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - estrategias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - Stale while revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network only
  event.respondWith(fetch(request));
});

// Network First Strategy (para APIs)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es POST/PUT/DELETE, guardar en queue para sync posterior
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await saveRequestForSync(request);
      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Operación guardada. Se sincronizará cuando tengas conexión.'
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Cache First Strategy (para assets estáticos)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());

  return networkResponse;
}

// Stale While Revalidate (para HTML)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    return caches.match('/offline.html');
  });

  return cachedResponse || fetchPromise;
}

// Background Sync - para operaciones offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncQueuedOperations());
  }
});

async function saveRequestForSync(request) {
  const db = await openDB();
  const clone = request.clone();
  const body = await clone.text();

  const operation = {
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: body,
    timestamp: Date.now()
  };

  await db.add('sync-queue', operation);

  // Registrar background sync
  await self.registration.sync.register('sync-operations');
}

async function syncQueuedOperations() {
  const db = await openDB();
  const operations = await db.getAll('sync-queue');

  console.log(`[SW] Syncing ${operations.length} queued operations`);

  for (const op of operations) {
    try {
      const response = await fetch(op.url, {
        method: op.method,
        headers: new Headers(op.headers),
        body: op.body
      });

      if (response.ok) {
        await db.delete('sync-queue', op.id);
        console.log('[SW] Synced operation:', op.url);

        // Notificar a la app
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              operation: op
            });
          });
        });
      }
    } catch (error) {
      console.error('[SW] Sync failed for:', op.url, error);
    }
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'Tienes una actualización',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: data.actions || [
      { action: 'view', title: 'Ver' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Arconte', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// IndexedDB para queue de operaciones
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('arconte-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}
