import { defineConfig } from 'tsup'

const REACT_ENTRY = 'src/react/index.ts'

export default defineConfig({
  entry: { index: REACT_ENTRY, core: 'src/core/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2019',
  plugins: [
    {
      // Per-entry banner: tsup's `banner` would also mark core as client-only. No `treeshake`: its rollup pass strips directives.
      name: 'use-client-banner',
      renderChunk(code, chunk) {
        if (chunk.entryPoint !== REACT_ENTRY) return
        return { code: `'use client'\n${code}` }
      },
    },
  ],
})
