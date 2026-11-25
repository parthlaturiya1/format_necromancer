import { expect, test } from '@playwright/test';

test('landing page loads, no errors, no foreign requests', async ({ page, baseURL }) => {
  const errors: string[] = [];
  const foreign: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (!r.url().startsWith(baseURL ?? '') && !r.url().startsWith('data:')) foreign.push(r.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Format Necromancer' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});
