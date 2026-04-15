import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://rams-kgmh.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/document-sources': {
        target: 'https://rams-kgmh.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
