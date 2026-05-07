import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

/**
 * Mirror the tsconfig "@/*" → ["./src/*", "./*"] mapping. We try
 * `./src/<rest>` first (libs + domain code) and fall back to `./<rest>`
 * (for `app/...` and other top-level imports).
 */
const SRC_ROOT = path.resolve(__dirname, './src')
const REPO_ROOT = path.resolve(__dirname, '.')

function resolveAlias(rest: string): string | null {
  const candidates = [path.join(SRC_ROOT, rest), path.join(REPO_ROOT, rest)]
  for (const base of candidates) {
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']) {
      const full = base + ext
      if (fs.existsSync(full) && fs.statSync(full).isFile()) return full
    }
  }
  return null
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'workspace-alias',
      enforce: 'pre',
      resolveId(source) {
        if (!source.startsWith('@/')) return null
        return resolveAlias(source.slice(2))
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/validation.test.ts'],
  },
})
