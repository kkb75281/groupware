const CACHE_NAME = 'fg-works-cache-v81'; // 버전 번호를 포함한 캐시 이름

// 설치 이벤트: 캐시 초기화
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html']);
    })
  );
});

// 활성화 이벤트: 오래된 캐시 정리
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

// fetch 이벤트: 네트워크 먼저 시도 -> 실패 시 캐시
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/version.json')) {
    event.respondWith(fetch(event.request)); // 무조건 네트워크에서 가져옴
  } else {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  }
});

let badgeCount = 0; // 뱃지 숫자를 저장할 변수

self.addEventListener('push', function (event) {
  const data = event.data.json();
  console.log('[Service Worker] Push Received.', data);
  const title = data.title || 'Default Title';
  const options = {
    body: data.body || 'Default Body',
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
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
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

self.addEventListener('message', async function (event) {
  if (event.data && event.data.type === 'RESET_BADGE') {
    // 메인 애플리케이션에서 전달된 뱃지 숫자로 초기화
    badgeCount = event.data.badgeCount || 0;
    console.log(`[Service Worker] Badge count reset to ${badgeCount}`);

    // PWA 뱃지도 초기화
    navigator
      .clearAppBadge()
      .then(() => {
        console.log('[Service Worker] App badge cleared.');
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to clear app badge:', error);
      });
  }

  if (event.data && event.data.type === 'CHECK_VERSION') {
    try {
      const response = await fetch('/version.json');
      const { version } = await response.json();

      event.source.postMessage({
        type: 'NEW_VERSION_AVAILABLE',
        version
      });
    } catch (error) {
      console.error('[Service Worker] Failed to fetch version.json:', error);
    }
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting(); // 사용자 선택 시 즉시 업데이트
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  // current website url
  let url = event.target.location.origin;
  event.waitUntil(clients.openWindow(url));
});
