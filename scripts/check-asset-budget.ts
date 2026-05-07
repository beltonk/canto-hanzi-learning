import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const INITIAL_SOUNDS_DIR = join(process.cwd(), 'public', 'sounds', '_initial')
const MAX_BYTES = 500 * 1024 // 500 KB

function dirSize(dir: string): number {
  try {
    return readdirSync(dir).reduce((total, file) => {
      const fullPath = join(dir, file)
      const stat = statSync(fullPath)
      return total + (stat.isFile() ? stat.size : dirSize(fullPath))
    }, 0)
  } catch {
    return 0
  }
}

const size = dirSize(INITIAL_SOUNDS_DIR)
const kb = (size / 1024).toFixed(1)
if (size > MAX_BYTES) {
  console.error(`❌ Initial sounds too large: ${kb} KB (max 500 KB)`)
  process.exit(1)
} else {
  console.log(`✓ Initial sounds budget OK: ${kb} KB / 500 KB`)
}
