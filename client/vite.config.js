import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Anything starting with these paths is passed to Express on port 3000
    proxy: {
      '/api': 'http://localhost:3000',
      '/utils': 'http://localhost:3000',
      '/classes': 'http://localhost:3000',
      '/races': 'http://localhost:3000',
      '/subclasses': 'http://localhost:3000',
    },
  },
});
