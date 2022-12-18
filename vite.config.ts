import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    target: 'webworker'
  },
  envPrefix: 'OPENAI_'
})