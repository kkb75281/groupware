// 서비스 워커 설치 및 활성화
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    event.waitUntil(self.skipWaiting()); // 즉시 활성화
});

    self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    event.waitUntil(self.clients.claim()); // 모든 클라이언트를 제어
});

self.addEventListener('push', function(event) {
    const data = event.data.json();
    const title = data.title || "Default Title";
    const options = {
        body: data.body || "Default Body",
        icon: 'icon-192x192.png',
        badge: 'icon-192x192.png'
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
	// // 뱃지 초기화
	// if ('clearAppBadge' in self.navigator) {
	// 	self.navigator.clearAppBadge().catch((error) => {
	// 	  console.error('Failed to clear app badge:', error);
	// 	});
	// }

	// // 메인 애플리케이션에 알림 클릭 이벤트 알림
	// self.clients.matchAll().then((clients) => {
	// 	clients.forEach((client) => {
	// 	  client.postMessage({ type: 'clear-badge' });
	// 	});
	// });

    event.notification.close();
    // current website url
    let url = event.target.location.origin;
    event.waitUntil(
        clients.openWindow(url)
    );
});