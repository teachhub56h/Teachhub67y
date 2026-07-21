// sw.js - Service Worker for Push Notifications
const CACHE_NAME = 'teachhub-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// PUSH NOTIFICATION HANDLER
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.message || 'New message from Admin',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        vibrate: [200, 100, 200],
        data: {
            chatId: data.chatId || '',
            url: data.url || '/'
        },
        actions: [
            {
                action: 'open',
                title: '📩 Open Chat'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Teach Hub', options)
    );
});

// NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
