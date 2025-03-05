import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '')
const serviceId = env.VITE_SERVICE_ID || 'default'
console.log({serviceId});

const config = {
    plugins: [
        vue(),
        VitePWA(
            {
                registerType: 'autoUpdate',
                devOptions: {
                    enabled: true, // 개발 환경에서 PWA 활성화
                    type: 'module', // 모듈 타입 사용
                    navigateFallback: null, // index.html 반환 방지
                    // 아래 옵션을 추가하여 dev-sw.js를 사용하지 않도록 설정
                    // suppressWarnings: true, // 경고 메시지 숨기기
                },
                injectManifest: {
                    swSrc: `public/wrk.${serviceId}.js`,
                },
                // workbox: {
                // 	cleanupOutdatedCaches: true,  // 오래된 캐시 삭제
                // 	// clientsClaim: true,           // 새 서비스 워커가 즉시 활성화되도록 설정
                // 	// skipWaiting: true,            // 기존 서비스 워커 무시하고 바로 새 서비스 워커 활성화
                // },
                manifest: {
                    name: "그룹웨어",
                    short_name: "그룹웨어",
                    start_url: "/",
                    display: "standalone",
                    theme_color: "#ffffff",
                    background_color: "#ffffff",
                    icons: [
                        // {
                        // 	src: "/favicon-icon.png",
                        // 	sizes: "144x144",
                        // 	type: "image/png",
                        // 	purpose: "any"
                        // },
                        {
                            src: "/icon-192.png",
                            sizes: "192x192",
                            type: "image/png",
                            purpose: "any"
                        },
                        {
                            src: "/icon-512.png",
                            sizes: "512x512",
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
        // https: {
        // 	key: fs.readFileSync('./certs/localhost-key.pem'),
        // 	cert: fs.readFileSync('./certs/localhost-cert.pem')
        // },
        host: 'localhost',
        port: 3333,
        allowedHosts: ['dev.broadwayinc.computer'],
        // port: 5173,
        // https: false, // HTTPS를 비활성화
        // host: 'localhost',
        // port: 5173,
        // cors: true,
    },
    // base: './',
}

// https://vite.dev/config/
export default defineConfig(config)
