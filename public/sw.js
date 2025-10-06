const CACHE_NAME = "gastos-app-v1.0.1"
const STATIC_CACHE = "gastos-static-v1.0.1"
const DYNAMIC_CACHE = "gastos-dynamic-v1.0.1"

const urlsToCache = [
  "/",
  "/dashboard",
  "/history", 
  "/profile",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg"
]

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...")
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activar Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("[SW] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Interceptar requests
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Estrategia Cache First para assets estáticos
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }
          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone()
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return fetchResponse
          })
        })
    )
    return
  }

  // Estrategia Network First para páginas
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => {
              return response || caches.match('/')
            })
        })
    )
    return
  }

  // Estrategia Stale While Revalidate para otros requests
  // Solo cachear requests GET, no POST/PUT/DELETE
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          const fetchPromise = fetch(request).then((fetchResponse) => {
            // Solo cachear si es GET y tiene status 200
            if (fetchResponse.status === 200 && request.method === 'GET') {
              const responseClone = fetchResponse.clone()
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return fetchResponse
          })

          return response || fetchPromise
        })
    )
  } else {
    // Para requests que no son GET (POST, PUT, DELETE), solo hacer fetch sin cachear
    event.respondWith(fetch(request))
  }
})
