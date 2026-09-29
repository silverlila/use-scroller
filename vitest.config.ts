import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  optimizeDeps: {
    include: [
      'vitest-browser-react',
      'react',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
      'react-dom/client',
      'react-dom/server',
    ],
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
