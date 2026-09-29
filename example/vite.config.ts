import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Exact-match patterns, so `use-scroller` doesn't also swallow `use-scroller/core`.
    alias: [
      { find: /^use-scroller\/core$/, replacement: fromRoot('../src/core/index.ts') },
      { find: /^use-scroller$/, replacement: fromRoot('../src/react/index.ts') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    fs: { allow: [fromRoot('..')] },
  },
})
