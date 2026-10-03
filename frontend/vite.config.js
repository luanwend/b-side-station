import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Send API calls to Flask, so the browser never needs CORS.
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
