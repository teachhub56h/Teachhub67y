// ==========================================
// 🔥 SERVICE WORKER - Teach Hub
// ==========================================

const CACHE_NAME = 'teachhub-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/logo-192.png',
    '/logo-512.png',
    '/manifest.json'
];

// ==========================================
// 🔥 INSTALL EVENT
// ==========================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// ==========================================
// 🔥 ACTIVATE EVENT
// ==========================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('✅ Old cache removed:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// ==========================================
// 🔥 FETCH EVENT
// ==========================================
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

// ==========================================
// 🔥 PUSH NOTIFICATION
// ==========================================
self.addEventListener('push', (event) => {
    let data = {
        title: 'Teach Hub',
        body: 'You have a new message',
        icon: '/logo-192.png',
        badge: '/logo-192.png'
    };

    try {
        if (event.data) {
            const parsedData = event.data.json();
            data.title = parsedData.title || data.title;
            data.body = parsedData.body || data.body;
            data.chatId = parsedData.chat_id || '';
        }
    } catch (e) {
        console.log('Push data parse error:', e);
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        data: {
            chatId: data.chatId,
            url: '/'
        },
        actions: [
            {
                action: 'open',
                title: '📩 Open Chat'
            },
            {
                action: 'close',
                title: '❌ Dismiss'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );

    // 🔥 NEW: Update badge count when push notification arrives
    updateBadgeCount();
});

// ==========================================
// 🔥 NOTIFICATION CLICK
// ==========================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }

    // Reset badge when notification is clicked
    resetBadgeCount();
});

// ==========================================
// 🔥 BADGE COUNT FUNCTIONS (NEW)
// ==========================================

// 🔥 Update app icon badge count
async function updateBadgeCount() {
    try {
        // Get unread count from Firestore or maintain a counter
        // For now, we'll increment a counter stored in cache
        const cache = await caches.open('badge-cache');
        let response = await cache.match('badge-count');
        let count = 0;
        
        if (response) {
            const text = await response.text();
            count = parseInt(text) || 0;
        }
        
        count += 1; // Increment for new message
        
        // Store new count
        const newResponse = new Response(String(count), {
            headers: { 'Content-Type': 'text/plain' }
        });
        await cache.put('badge-count', newResponse);
        
        // Set badge on app icon
        if (navigator.setAppBadge) {
            await navigator.setAppBadge(count);
            console.log('✅ Badge set to:', count);
        } else {
            console.log('⚠️ setAppBadge not supported');
        }
    } catch (error) {
        console.log('❌ Badge update error:', error);
    }
}

// 🔥 Reset badge count
async function resetBadgeCount() {
    try {
        // Clear badge
        if (navigator.clearAppBadge) {
            await navigator.clearAppBadge();
            console.log('✅ Badge cleared');
        }
        
        // Reset stored count
        const cache = await caches.open('badge-cache');
        await cache.put('badge-count', new Response('0', {
            headers: { 'Content-Type': 'text/plain' }
        }));
        
    } catch (error) {
        console.log('❌ Badge reset error:', error);
    }
}

// 🔥 Listen for messages from client to update badge
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_BADGE') {
        const count = event.data.count || 0;
        if (count > 0) {
            if (navigator.setAppBadge) {
                navigator.setAppBadge(count);
            }
        } else {
            if (navigator.clearAppBadge) {
                navigator.clearAppBadge();
            }
        }
    }
});

// ==========================================
// 🔥 BACKGROUND SYNC (Optional)
// ==========================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    console.log('🔄 Syncing messages...');
    // Add your sync logic here
}
