import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  server: {
    proxy: {
      '/api.v1.KatariveService': {
        target: 'http://localhost:9421',
        changeOrigin: true,
      },
      '/file': {
        target: 'http://localhost:9421',
        changeOrigin: true,
      },
    },
  },
})
