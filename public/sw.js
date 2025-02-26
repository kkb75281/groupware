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
	console.log('[Service Worker] Push Received.', data);
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

	// 알림 닫기
    event.notification.close();

    // 현재 웹사이트 URL
    let url = event.target.location.origin;

	// 메인 애플리케이션에 메세지 전송
    event.waitUntil(
        // clients.openWindow(url)
		clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'notification-clicked' });
            });

            // 새 창 열기 (옵션)
            if (!clients.length) {
                return clients.openWindow(url);
            }
        })
    );
});