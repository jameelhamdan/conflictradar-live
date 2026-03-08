import { defineConfig } from 'waku/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { version } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf-8'),
)

export default defineConfig({
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify(`v${version}`),
    },
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
      },
    },
  },
})
