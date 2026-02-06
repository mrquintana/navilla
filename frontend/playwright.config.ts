import { defineConfig, devices } from '@playwright/test';

// Check if testing against external URL (AWS)
const isExternalUrl = process.env.E2E_BASE_URL?.startsWith('https://');

/**
 * Playwright E2E testing configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Running modes:
 * 1. Local dev: npm run test:e2e (starts dev server automatically)
 * 2. CI: Serves built files with vite preview
 * 3. AWS: E2E_BASE_URL=https://navilla.app npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  // Increase timeout for AWS tests (network latency)
  timeout: isExternalUrl ? 60000 : 30000,
  expect: {
    timeout: isExternalUrl ? 10000 : 5000,
  },

  use: {
    baseURL: process.env.E2E_BASE_URL
      || (process.env.CI ? 'http://localhost:4173' : 'http://localhost:5174'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start server if testing against external URL
  webServer: isExternalUrl
    ? undefined
    : process.env.CI
      ? {
          // In CI, serve the built files
          command: 'npm run preview',
          url: 'http://localhost:4173',
          reuseExistingServer: false,
          timeout: 120000,
          env: { VITE_E2E_MODE: 'true' },
        }
      : {
          // E2E dev server on port 5174 (separate from regular dev server on 5173)
          command: 'VITE_E2E_MODE=true npm run dev -- --port 5174',
          url: 'http://localhost:5174',
          reuseExistingServer: true,
          timeout: 120000,
        },
});
