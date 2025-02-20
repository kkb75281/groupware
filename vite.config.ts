import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
	VitePWA(
		{
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
				name: "그룹웨어",
				short_name: "그룹웨어",
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
						sizes: "1280x800",
						type: "image/png",
						form_factor: "wide"
					},
					{
						src: "/screenshot-mobile.png",
						sizes: "720x800",
						type: "image/png",
						form_factor: "narrow"
					}
				]
			}
		}
	),
    // // SVG 플러그인 추가
    // svgLoader({
    //   defaultImport: 'url'
    // })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    https: false, // HTTPS를 비활성화
    host: 'localhost',
    port: 5173,
  },
})
