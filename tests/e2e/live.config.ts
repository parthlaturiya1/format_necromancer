import { defineConfig } from '@playwright/test';

// Same golden run against a deployed URL: BASE_URL=https://... npx playwright test -c tests/e2e/live.config.ts
export default defineConfig({
  testDir: '.',
  testMatch: 'golden-run.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL, browserName: 'chromium' },
});
