import { defineConfig } from 'vitest/config'

// The unit suite is plain Node modules; the Playwright specs under tests/e2e
// are run by `npm run test:e2e` instead.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
})
