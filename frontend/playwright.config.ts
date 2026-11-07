import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

// Keep the optional browser download inside the authorized frontend directory.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(new URL('./.browsers', import.meta.url))

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    locale: 'es-BO',
    timezoneId: 'America/La_Paz',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', testIgnore: '**/access-config.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'missing-auth-config', testMatch: '**/access-config.spec.ts', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5175' } },
  ],
  // Isolated servers always override .env.local; tests never use real project keys.
  webServer: [
    {
      command: 'npm run dev -- --port 5174', url: 'http://127.0.0.1:5174', reuseExistingServer: false, timeout: 60_000,
      env: { VITE_SUPABASE_URL: 'https://auth.vitafarma.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local-tests-only' },
    },
    {
      command: 'npm run dev -- --port 5175', url: 'http://127.0.0.1:5175', reuseExistingServer: false, timeout: 60_000,
      env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
    },
  ],
})
