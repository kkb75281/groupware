import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
	base: '/',
  	plugins: [
		vue(),
		VitePWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: null, // index.html 반환 방지
			},
			workbox: {
				cleanupOutdatedCaches: true,  // 오래된 캐시 삭제
				// clientsClaim: true,           // 새 서비스 워커가 즉시 활성화되도록 설정
				// skipWaiting: true,            // 기존 서비스 워커 무시하고 바로 새 서비스 워커 활성화
			},
			manifest: {
				name: "어플리케이션",
				short_name: "어플",
				start_url: "/",
				display: "standalone",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				icons: [
					{
						src: "/favicon-icon.png",
						sizes: "144x144",
						type: "image/png",
						purpose: "any"
					},
				],
				screenshots: [
					{
						src: "/screenshot-desktop.png",
						sizes: "2560x1600",
						type: "image/png",
						form_factor: "wide"
					},
					{
						src: "/screenshot-mobile.png",
						sizes: "1440x1600",
						type: "image/png",
						form_factor: "narrow"
					}
				]
			}
		}),
	],
	build: {
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) => {
				if (assetInfo.name?.includes('workbox-')) {
					return 'public/[name]-[hash][extname]'; // public에 복사
				}
				return 'assets/[name]-[hash][extname]';
				},
			},
		},
	},
	resolve: {
		alias: {
		'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	server: {
		https: false,
		host: 'localhost',
		port: 5173,
		middlewareMode: false, // true면 Vite가 `dev-sw.js`를 서빙하지 않을 수도 있음
	},
})
