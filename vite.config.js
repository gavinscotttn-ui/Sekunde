import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { CONTENT_SECURITY_POLICY_META } from './security/headers.js'

// Puts the production Content-Security-Policy into the built index.html so the
// page defends itself even if it is ever served by a host that forgets the HTTP
// headers. It is skipped during `vite dev`, where the dev server needs inline
// scripts and a websocket for hot reloading.
function contentSecurityPolicy() {
  return {
    name: 'crf-content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return {
          html,
          tags: [
            {
              tag: 'meta',
              attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY_META },
              injectTo: 'head-prepend',
            },
          ],
        }
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  build: {
    target: 'es2020',
    sourcemap: false,
    // The polyfill falls back to fetch(), which the policy's connect-src 'none'
    // forbids. Every browser we support handles modulepreload natively.
    modulePreload: { polyfill: false },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
