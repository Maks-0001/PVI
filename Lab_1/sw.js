
const CACHE_NAME = "pwa-cache-v1";

const ASSETS = [
  "/",                  
  "/index.html",           
  "/dashboard.html",           
  "/header.html", 
  "/messages.html",
  "/tasks.html",
  "/static/styles/style.css", 
  "/static/styles/navbar.css",
  "/static/styles/table.css",
  "/static/images/istockphoto-1495088043-612x612.jpg",
  "/static/images/depositphotos_595497586-stock-illustration-letter-logo-vector-illustration-symbol.jpg",  
  "/js/functional.js",
  "/js/header.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кешування ресурсів...");
      return cache.addAll(ASSETS).catch(console.error);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        return cachedResponse || networkFetch;
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) 
          .map((key) => caches.delete(key))   
      );
    }).then(() => {
      console.log("Новий Service Worker активовано.");
      return self.clients.claim();
    })
  );
});