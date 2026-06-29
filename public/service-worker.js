/**
 * EFC Rwanda Progressive Web App (PWA) Service Worker
 * 
 * Provides robust offline access to the LearningHub, lessons, debate forum,
 * and practice arena. Implements dynamic caching (Stale-While-Revalidate)
 * to ensure rapid load times and offline reliability in areas with unstable connectivity.
 */

const CACHE_NAME = "efc-pwa-cache-v1";

// Base shell resources to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://img.icons8.com/color/192/000000/globe.png",
  "https://img.icons8.com/color/512/000000/globe.png"
];

// Install Event - Pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core shell...");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force immediate takeover
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Become active immediately for all clients
      return self.clients.claim();
    })
  );
});

// Fetch Event - Handle offline routing and caching
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests, Firebase authentication / firestore, and dev server sockets
  if (
    request.method !== "GET" ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit") ||
    url.hostname.includes("securetoken") ||
    url.pathname.startsWith("/vite") ||
    url.pathname.includes("hot-update") ||
    request.url.startsWith("ws:") ||
    request.url.startsWith("wss:")
  ) {
    return;
  }

  // 2. SPA Route Fallback - If navigating to a subpage offline, return the index.html shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        console.log("[Service Worker] Offline navigate detected, serving cached index.html shell...");
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate Strategy for static files and local assets
  // This loads assets instantly from cache while updating them in the background
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((err) => {
            console.warn("[Service Worker] Fetch failed for local asset, serving cached version if any:", url.pathname);
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 4. Default Network-First falling back to Cache for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses from external resources (like fonts or common icons)
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        console.log("[Service Worker] Serving fallback from cache for:", url.pathname);
        return caches.match(request);
      })
  );
});
