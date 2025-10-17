// service-worker.js - ESTRATEGIAS DE CACHE AVANZADAS
const CACHE_NAME = 'taskflow-v4';
const SYNC_STORE_NAME = 'pending-sync';
const OFFLINE_PAGE = '/offline.html';

// Recursos estáticos (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/Task.tsx',
  '/src/Task.css',
  '/src/utils/idb.ts'
];

// Recursos dinámicos (CSS, JS externos)
const DYNAMIC_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación - Cachear App Shell
// service-worker.js (en raíz del proyecto)
const CACHE_NAME = 'taskflow-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/Task.tsx'
];
self.addEventListener('install', (event) => {
  console.log('Service Worker instalándose...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cacheando App Shell...');
        return cache.addAll([...STATIC_ASSETS, ...DYNAMIC_ASSETS]);
        console.log('Cacheando recursos...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - Limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background Sync (mantener existente)
self.addEventListener('sync', (event) => {
  console.log('Evento sync detectado:', event.tag);
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks());
  }
});

// ESTRATEGIAS DE CACHE - Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Estrategia: Network First para APIs
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
  }
  // Estrategia: Cache First para App Shell
  else if (isAppShellRequest(event.request)) {
    event.respondWith(cacheFirstStrategy(event.request));
  }
  // Estrategia: Stale While Revalidate para imágenes y recursos externos
  else if (isImageRequest(event.request) || isExternalResource(event.request)) {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
  }
  // Estrategia por defecto: Network First
  else {
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// ESTRATEGIA 1: Cache First (para App Shell)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('✅ Cache First - Sirviendo desde cache:', request.url);
      return cachedResponse;
    }
    
    // Si no está en cache, hacer fetch y cachear
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Cache First - Error:', request.url, error);
    // Para App Shell, si falla, mostrar página offline
    if (request.destination === 'document') {
      return caches.match(OFFLINE_PAGE);
    }
    return new Response('Resource not available offline', { 
      status: 408, 
      statusText: 'Offline' 
    });
  }
}

// ESTRATEGIA 2: Stale While Revalidate (para imágenes y recursos no críticos)
async function staleWhileRevalidateStrategy(request) {
  try {
    // Primero devolver del cache si existe
    const cachedResponse = await caches.match(request);
    // En paralelo, intentar actualizar el cache
    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        console.log('🔄 Stale While Revalidate - Cache actualizado:', request.url);
      }
      return networkResponse;
    }).catch(() => {
      // Silenciar errores de fetch para esta estrategia
      console.log('⚠️ Stale While Revalidate - No se pudo actualizar:', request.url);
    });
    // Devolver cache inmediatamente, actualizar en segundo plano
    if (cachedResponse) {
      console.log('✅ Stale While Revalidate - Sirviendo desde cache:', request.url);
      return cachedResponse;
    }

    // Si no hay cache, esperar por la red
    return await fetchPromise;
  } catch (error) {
    console.log('❌ Stale While Revalidate - Error:', request.url, error);
    // Para imágenes, devolver un placeholder si no hay cache
    if (isImageRequest(request)) {
      return new Response(
        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" font-family="Arial" font-size="10" text-anchor="middle" fill="#666">Imagen no disponible</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return new Response('Resource not available', { status: 404 });
  }
}

// ESTRATEGIA 3: Network First (para datos que necesitan frescura)
async function networkFirstStrategy(request) {
  try {
    console.log('🌐 Network First - Intentando red:', request.url);
    const networkResponse = await fetch(request);
    
    // Si la red responde, actualizar cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('✅ Network First - Respuesta desde red:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Network First - Red falló, buscando en cache:', request.url);
    
    // Si la red falla, buscar en cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('✅ Network First - Sirviendo desde cache:', request.url);
      return cachedResponse;
    }
    
    // Si no hay cache y es una página, mostrar offline page
    if (request.destination === 'document') {
      const offlinePage = await caches.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Para APIs, devolver error específico
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ 
        error: 'Offline', 
        message: 'No hay conexión y no hay datos en cache' 
      }), {
        status: 408,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Resource not available offline', { 
      status: 408, 
      statusText: 'Offline' 
    });
  }
}

// FUNCIONES AUXILIARES PARA CLASIFICAR REQUEST
function isAppShellRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.css') ||
    STATIC_ASSETS.includes(url.pathname)
  );
}

function isImageRequest(request) {
  return (
    request.destination === 'image' ||
    /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(request.url)
  );
}

function isExternalResource(request) {
  const url = new URL(request.url);
  return !url.origin.includes(self.location.origin);
}

// FUNCIONES EXISTENTES (Background Sync)
async function syncPendingTasks() {
  try {
    console.log('Iniciando sincronización de tareas...');
    
    const db = await openDB('taskflow-db', 1);
    let pendingTasks = [];
    
    try {
      pendingTasks = await db.getAll(SYNC_STORE_NAME);
    } catch (error) {
      console.log('No hay tareas pendientes para sincronizar');
      return;
    }
    
    console.log(`Tareas pendientes a sincronizar: ${pendingTasks.length}`);
    
    for (const task of pendingTasks) {
      console.log('Sincronizando tarea:', task);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Tarea sincronizada exitosamente:', task.text);
        await db.delete(SYNC_STORE_NAME, task.id);
        
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              task: task
            });
          });
        });
      } else {
        console.log('❌ Error sincronizando tarea:', task.text);
      }
    }
    
    console.log('Sincronización completada');
    
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Evento para recibir notificaciones push
self.addEventListener('push', (event) => {
  console.log('📬 Evento push recibido:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.log('Error parseando datos push:', error);
    data = {
      title: 'TaskFlow',
      body: 'Tienes una nueva notificación',
      icon: '/icon-192.png'
    };
  }

  const options = {
    body: data.body || '¡Nueva actualización en tus tareas!',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    image: data.image,
    data: data.data || { url: data.url || '/' },
    actions: [
      {
        action: 'open',
        title: 'Abrir TaskFlow'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    tag: data.tag || 'taskflow-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TaskFlow', options)
  );
});

// Evento cuando el usuario hace clic en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificación clickeada:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Buscar si ya hay una ventana abierta
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Evento cuando se cierra la notificación
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada:', event);
});

// Background Sync para notificaciones (opcional)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Suscripción push cambiada:', event);
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U')
    }).then((subscription) => {
      console.log('Nueva suscripción:', subscription);
      // Aquí enviarías la nueva suscripción al servidor
    })
  );
});

// Función auxiliar para convertir clave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devuelve el cache o hace fetch
        return response || fetch(event.request);
      })
  );
});
