import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const fromHere = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  base: process.env.SITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^use-scroller\/core$/, replacement: fromHere('../src/core/index.ts') },
      { find: /^use-scroller$/, replacement: fromHere('../src/react/index.ts') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    fs: { allow: [fromHere('..')] },
  },
})
