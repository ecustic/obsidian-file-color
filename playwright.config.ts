import { defineConfig } from '@playwright/test'

const env = (globalThis as any).process.env

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  fullyParallel: false,
  workers: env.CI ? 1 : 1,
  forbidOnly: !!env.CI,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  reporter: env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Electron is launched explicitly by the custom fixture, which records and
  // attaches Electron-window screenshots/traces on failure.
  projects: [
    { name: 'e2e', testMatch: 'plugin.spec.ts' },
    { name: 'e2e-setup', testDir: './tests/e2e/setup', testMatch: 'setup.spec.ts' },
  ],
})
