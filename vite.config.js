/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      // Optional: you can define release if you version builds
      // release: process.env.VITE_RELEASE,
    }),
  ],
  build: {
    sourcemap: true, // Needed so Sentry can map minified code to original files
  },
  server: {
    proxy: {
      // Proxy share URLs to backend API for OG meta tags
      '/api/share': {
        target: 'https://localhost:7142',
        changeOrigin: true,
        secure: false, // Allow self-signed certs in dev
      },
      // Proxy OG image routes
      '/og': {
        target: 'https://localhost:7142',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
