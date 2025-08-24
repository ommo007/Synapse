import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "vidyalankar-institute-of-techn",
    project: "synapse"
  })],

  server: {
    port: 5173,
    host: true
  },

  build: {
    sourcemap: true
  }
})