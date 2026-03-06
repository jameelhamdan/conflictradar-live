import { defineConfig } from 'waku/config'

export default defineConfig({
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
      },
    },
  },
})
