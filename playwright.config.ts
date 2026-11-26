import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // perf.spec.ts holds the wall-clock bars; it runs only through scripts/perf.mjs (PERF=1), so verify runs it once, as its own step.
  testMatch: process.env.PERF ? /perf\.spec\.ts/ : undefined,
  testIgnore: process.env.PERF ? undefined : /perf\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  // C-2: on CI the github reporter turns each failed test into a public ::error annotation (the job log needs a sign-in).
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});

