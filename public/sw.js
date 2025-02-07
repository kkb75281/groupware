// import { unreadCount } from './../src/notifications.ts'; 

/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
	let registry = {};

	// Used for `eval` and `importScripts` where we can't get script URL by other means.
	// In both cases, it's safe to use a global var because those functions are synchronous.
	let nextDefineUri;

	const singleRequire = (uri, parentUri) => {
		uri = new URL(uri + ".js", parentUri).href;

		return registry[uri] || (
		
			new Promise(resolve => {
				if ("document" in self) {
					const script = document.createElement("script");
					script.src = uri;
					script.onload = resolve;
					document.head.appendChild(script);
				} else {
					nextDefineUri = uri;
					importScripts(uri);
					resolve();
				}
			}).then(() => {
				let promise = registry[uri];
				if (!promise) {
					throw new Error(`Module ${uri} didn’t register its module`);
				}
				return promise;
			})
		);
	};

	self.define = (depsNames, factory) => {
		const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
		if (registry[uri]) {
			// Module is already loading or loaded.
			return;
		}
		let exports = {};
		const require = depUri => singleRequire(depUri, uri);
		const specialDeps = {
			module: { uri },
			exports,
			require
		};
		registry[uri] = Promise.all(depsNames.map(
			depName => specialDeps[depName] || require(depName)
		)).then(deps => {
			factory(...deps);
			return exports;
		});
	};
}

define(['./workbox-54d0af47'], (function (workbox) { 'use strict';

	self.skipWaiting();
	workbox.clientsClaim();

	/**
	 * The precacheAndRoute() method efficiently caches and responds to
	 * requests for URLs in the manifest.
	 * See https://goo.gl/S9QRab
	 */
	workbox.precacheAndRoute([{
		"url": "registerSW.js",
		"revision": "3ca0b8505b4bec776b69afdba2768812"
	}, {
		"url": "index.html",
		"revision": "0.52266q72dt"
	}], {});
	workbox.cleanupOutdatedCaches();
	workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
		allowlist: [/^\/$/]
	}));

}));

// 푸시 알람을 받았을 때 뱃지 표시
self.addEventListener("push", function (event) {
	const data = event.data ? event.data.json() : {};
  
	const options = {
		body: data.body || "새로운 알림이 도착했습니다!",
		icon: "/icons/icon-192.png",
		badge: "/icons/badge-72x72.png", // 뱃지 아이콘 (Android만 지원)
		data: { url: data.url || "/" },
	};
  
	event.waitUntil(
		self.registration.showNotification(data.title || "알림", options)
	);
  
	// 🔥 뱃지 업데이트 (Android & Windows 지원)
	if ("setAppBadge" in navigator) {
		// navigator.setAppBadge(unreadCount.value); // 예제: 새 알림이 3개 있다고 설정
	}
});

// 알림 클릭 시 뱃지 제거
self.addEventListener("notificationclick", function (event) {
	event.notification.close(); // 알림 닫기
  
	// 뱃지 초기화
	if ("clearAppBadge" in navigator) {
		navigator.clearAppBadge();
	}
  
	event.waitUntil(
		clients.openWindow(event.notification.data.url || "/")
	);
});

if (Notification.permission === 'granted') {
	navigator.serviceWorker.ready.then(function(registration) {
	  registration.showNotification('테스트 푸시 알림', {
		body: '이건 테스트용 알림입니다.',
		icon: '/icons/icon-192x192.png',
		badge: '/icons/badge-72x72.png'
	  });
	});
  } else {
	console.log('알림 권한이 없습니다.');
  }