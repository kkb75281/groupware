const CACHE_NAME = 'fg-works-cache-v52'; // 버전 번호를 포함한 캐시 이름

// 서비스 워커 설치 및 활성화
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');

	event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/', // 메인 페이지
                '/index.html',
            ]);
        })
        // self.skipWaiting(); // 주석 처리 또는 삭제
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');

	// // 클라이언트 제어는 우선 처리
    // event.waitUntil(self.clients.claim());

    // // 캐시 정리는 비동기적으로 처리
    // caches.keys().then((cacheNames) => {
    //     cacheNames.forEach((cache) => {
    //         if (cache !== CACHE_NAME) {
    //             console.log(`[Service Worker] Deleting old cache: ${cache}`);
    //             caches.delete(cache);
    //         }
    //     });
    // });

	event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log(`[Service Worker] Deleting old cache: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 모든 클라이언트를 즉시 제어
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/version.json')) {
        event.respondWith(fetch(event.request));
    } else {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});

let badgeCount = 0; // 뱃지 숫자를 저장할 변수

self.addEventListener('push', function(event) {
	const data = event.data.json();
	console.log('[Service Worker] Push Received.', data);
    const title = data.title || "Default Title";
    const options = {
        body: data.body || "Default Body",
        icon: 'icon-192x192.png',
        badge: 'icon-192x192.png'
    };

	// 알림 표시 및 뱃지 업데이트
    event.waitUntil(
        Promise.all([
            // 1. 알림 표시
            self.registration.showNotification(title, options),

            // 2. PWA 뱃지 업데이트
            (async () => {
                try {
                    // 현재 뱃지 숫자를 1 증가
                    badgeCount++;

                    // 새로운 뱃지 숫자 설정
                    await navigator.setAppBadge(badgeCount);
                    console.log(`[Service Worker] Badge updated to ${badgeCount}`);

                    // main.ts로 newBadgeCount 전송
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'BADGE_UPDATED',
                                badgeCount: badgeCount
                            });
                        });
                    });
                } catch (error) {
                    console.error('[Service Worker] Failed to update badge:', error);
                }
            })()
        ])
    );
});

self.addEventListener('message', async function(event) {
    if (event.data && event.data.type === 'RESET_BADGE') {
        // 메인 애플리케이션에서 전달된 뱃지 숫자로 초기화
        badgeCount = event.data.badgeCount || 0;
        console.log(`[Service Worker] Badge count reset to ${badgeCount}`);

        // PWA 뱃지도 초기화
        navigator.clearAppBadge().then(() => {
            console.log('[Service Worker] App badge cleared.');
        }).catch(error => {
            console.error('[Service Worker] Failed to clear app badge:', error);
        });
    }

	if (event.data && event.data.type === 'CHECK_VERSION') {
        try {
            const response = await fetch('/version.json');
            const { version } = await response.json();

            // 메인 스레드로 새 버전 정보 전송
            event.source.postMessage({
                type: 'NEW_VERSION_AVAILABLE',
                version
            });
        } catch (error) {
            console.error('[Service Worker] Failed to fetch version.json:', error);
        }
    } 
	
	if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting(); // 대기 중인 서비스 워커를 즉시 활성화
    }
});

self.addEventListener('notificationclick', function(event) {
	event.notification.close();
    // current website url
    let url = event.target.location.origin;
    event.waitUntil(
        clients.openWindow(url)
    );
});