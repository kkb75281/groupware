import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // SVG 플러그인 추가
    svgLoader({
      defaultImport: 'url'
    })
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
