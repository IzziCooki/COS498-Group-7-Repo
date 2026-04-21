import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['agent.deanhauser.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/images': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ui-references': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
