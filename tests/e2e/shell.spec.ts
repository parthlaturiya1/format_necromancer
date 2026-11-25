import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');

function watch(page: Page, baseURL: string) {
  const errors: string[] = [];
  const foreign: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(baseURL) && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(u);
  });
  return { errors, foreign };
}

async function axe(page: Page) {
  await page.evaluate(AXE);
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: () => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }).axe.run();
    return r.violations.map((v) => `${v.id} x${v.nodes.length}`);
  });
}

test('shell: footer, landmarks, worker proven, no errors, no foreign requests', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Format Necromancer' })).toBeVisible();
  await expect(page.getByText('Runs in your browser. Nothing is uploaded.')).toBeVisible();
  await expect(page.getByText('Created by Parth Radheshyam Laturiya. Direction, product decisions and review by the owner; code written by Kiro.')).toBeVisible();
  await expect(page.getByText('Drop a file nothing can open, or resurrect a sample')).toBeVisible();
  for (const name of ['Bytes', 'Recovered image', 'Confidence grid', 'Confidence by row', 'Verification']) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }
  await expect(page.locator('[data-engine-status="ready"]')).toBeAttached({ timeout: 15000 });
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('shell: loading state, 404 page and 500 page are reachable', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.goto('/#loading');
  await expect(page.getByText('Reading the bytes')).toBeVisible();
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: 'Nothing is buried here' })).toBeVisible();
  await page.goto('/');
  await page.evaluate(() => { window.location.hash = 'crash'; });
  await expect(page.getByRole('heading', { name: 'The app stopped' })).toBeVisible();
  expect(seen.foreign).toEqual([]);
});

test('shell: axe finds no violations (desktop, phone, 404)', async ({ page }) => {
  for (const [w, h, url] of [[1440, 900, '/'], [390, 844, '/'], [1440, 900, '/404.html']] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    expect(await axe(page), `${url} ${w}x${h}`).toEqual([]);
  }
});

test('shell: phone has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test('shell: initial JS under 250 KB gzipped', async ({ page, baseURL }) => {
  const sizes: Promise<number>[] = [];
  page.on('response', (r) => {
    if (r.url().endsWith('.js') && r.url().startsWith(baseURL!)) sizes.push(r.body().then((b) => gzipSync(b).length));
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const total = (await Promise.all(sizes)).reduce((a, b) => a + b, 0);
  console.log(`initial JS gzipped bytes: ${total}`);
  expect(total).toBeLessThan(250 * 1024);
});

test('screenshots (only when SHOTS=1)', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'set SHOTS=1');
  for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/verification/screens/t13-${name}.png`, fullPage: name === 'phone' });
  }
});
