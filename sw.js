// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// 🔥 FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyDk4bnJuVfSQZua61dyIDajjC6u1U",
    authDomain: "newpro-affc8.firebaseapp.com",
    projectId: "newpro-affc8",
    storageBucket: "newpro-affc8.firebasestorage.app",
    messagingSenderId: "1080341611919",
    appId: "1:1080341611919:web:373d7fa13901e4b41c77fa"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🔥 BACKGROUND MESSAGE HANDLER (OFFLINE SUPPORT)
messaging.onBackgroundMessage((payload) => {
    console.log('📩 Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || '📩 Teach Hub Support';
    const notificationOptions = {
        body: payload.notification?.body || 'New message from Admin',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        vibrate: [200, 100, 200, 100, 400],
        sound: 'notification.mp3',
        data: {
            url: payload.fcmOptions?.link || '/'
        },
        actions: [
            {
                action: 'open',
                title: '📩 Open Chat'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🔥 NOTIFICATION CLICK HANDLER
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
