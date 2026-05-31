import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const webRoot = path.dirname(fileURLToPath(import.meta.url))
const sharedEntry = path.resolve(webRoot, '../../packages/shared/src/index.ts')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Use workspace source in dev so new shared exports are not blocked by a stale pre-bundle.
      '@oma-forge/shared': sharedEntry,
    },
  },
  optimizeDeps: {
    exclude: ['@oma-forge/shared'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
