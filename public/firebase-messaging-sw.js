/* eslint-disable no-restricted-globals */
// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBm_DiMmjZnnTujobERh0j6vnJaP34rcYs",
  projectId: "superb-dryad-kvxch",
  messagingSenderId: "885378371852",
  appId: "1:885378371852:web:93b882cd3cd30955bb3929"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Mehedi Telecom EMI';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have an EMI reminder.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'emi-reminder',
    data: payload.data || {},
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
