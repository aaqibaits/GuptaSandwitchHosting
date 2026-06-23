import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}  // This defines process.env globally
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5002',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'build',
  }
})