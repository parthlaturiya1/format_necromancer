import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { expect, test, type Page } from '@playwright/test';
import { decodePng } from '../../src/engine/png';
import { BLIND, DEFAULT, sampleById } from './sample';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const SCREENS = 'docs/verification/screens';
const inflate = async (d: Uint8Array) => new Uint8Array(inflateSync(d));

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

/** Opens a bundled sample at its end state (the ritual held at its last beat) so the test does not wait for motion. */
async function open(page: Page, id: string, extra = '') {
  await page.goto(`/?demo=1&sample=${id}&beat=6&p=1${extra}`);
  await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 30000 });
}

test('default sample: exact badge, 0 mismatches, full bar, charts, grid, no console errors', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, DEFAULT.id);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  await expect(page.getByTestId('mismatch-count')).toHaveText('0');
  await expect(page.locator('.v-bar')).toHaveAttribute('aria-label', `${(DEFAULT.width * DEFAULT.height).toLocaleString('en-US')} of ${(DEFAULT.width * DEFAULT.height).toLocaleString('en-US')} pixels match the reference`);
  expect(await page.locator('.dots i[data-s]').count()).toBe(DEFAULT.height);
  await expect(page.getByTestId('mean')).toHaveText(/^mean \d\.\d\d$/);
  await expect(page.getByTestId('coverage')).toContainText('Explained');
  await page.waitForTimeout(1200); // let the draw-in finish
  await page.screenshot({ path: `${SCREENS}/t17-done.png` });
  expect(await axe(page), 'axe 1440').toEqual([]);
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('text-fire (a non-default bundled sample) is checked and exact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const s = sampleById('text-fire-160x32');
  await open(page, s.id);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  await expect(page.getByText('Your own file has no reference picture')).toHaveCount(0);
  expect(await page.locator('.dots i[data-s]').count()).toBe(s.height);
});

test('picker: choosing a sample verifies it; the blind test is labelled and exact', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?speed=4');
  await page.getByTestId('sample-pick').selectOption(BLIND.id);
  await page.getByRole('button', { name: 'Skip to result' }).click({ timeout: 30000 });
  await expect(page.getByTestId('blind-label')).toHaveText('Held-out file, never used for tuning.');
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  await expect(page.getByTestId('mismatch-count')).toHaveText('0');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SCREENS}/t17-blind.png` });
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('a user file shows "No reference available" and never claims correctness', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?speed=4');
  // The same bytes as the sample, but handed in as the user's own file with another name: it has no reference, so nothing may be claimed.
  const base = readFileSync(`public/samples/${DEFAULT.id}.pcx`);
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'mine.bin', mimeType: 'application/octet-stream', buffer: base });
  await page.getByRole('button', { name: 'Skip to result' }).click({ timeout: 30000 });
  await expect(page.getByTestId('badge')).toHaveText('No reference available');
  await expect(page.getByTestId('v-note')).toContainText('Nothing here says it is correct');
  await expect(page.getByTestId('mismatch-count')).toHaveCount(0);
  await expect(page.getByTestId('blind-label')).toHaveCount(0);
});

test('a mutated sample is Not exact, with a count and the first mismatches', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const bytes = Buffer.from(readFileSync(`public/samples/${DEFAULT.id}.pcx`));
  // Flip one low bit of the colour of a repeat run (the byte after a run marker, 0xC0 or more): same layout, a whole run of pixels differs.
  let at = -1;
  for (let i = 400; i < bytes.length - 800; i++) if (bytes[i - 1]! >= 0xc0 && bytes[i]! < 0xc0) { at = i; break; }
  expect(at).toBeGreaterThan(0);
  bytes[at] = bytes[at]! ^ 1;
  await page.route(`**/samples/${DEFAULT.id}.pcx`, (r) => r.fulfill({ status: 200, contentType: 'application/octet-stream', body: bytes }));
  await open(page, DEFAULT.id);
  await expect(page.getByTestId('badge')).toHaveText('Not exact', { timeout: 20000 });
  const n = Number(((await page.getByTestId('mismatch-count').textContent()) ?? '0').replace(/,/g, ''));
  expect(n).toBeGreaterThan(0);
  await expect(page.locator('.mm li')).not.toHaveCount(0); // C-2: waits for the render (a one-shot count raced it on a 2-core runner)
  expect(await page.locator('.mm li').first().textContent()).toMatch(/^row \d+, col \d+: rgb\(.*\) expected, rgb\(.*\) found$/);
});

test('downloads: the PNG round-trips to the reference and the JSON parses', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, DEFAULT.id);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download image' }).click()]);
  const pngPath = `${test.info().outputDir}/recovered.png`;
  await png.saveAs(pngPath);
  expect(png.suggestedFilename()).toBe(`${DEFAULT.id}-recovered.png`);
  const got = await decodePng(new Uint8Array(readFileSync(pngPath)), inflate);
  const ref = await decodePng(new Uint8Array(readFileSync(`public/samples/${DEFAULT.id}.png`)), inflate);
  expect([got.width, got.height]).toEqual([ref.width, ref.height]);
  expect(Buffer.compare(Buffer.from(got.rgb), Buffer.from(ref.rgb))).toBe(0);
  const [js] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download evidence report' }).click()]);
  const jsPath = `${test.info().outputDir}/evidence.json`;
  await js.saveAs(jsPath);
  const report = JSON.parse(readFileSync(jsPath, 'utf8')) as { recovery: { status: string; rows: unknown[] }; verification: { mode: string; exact: boolean; mismatchCount: number } };
  expect(report.recovery.status).toBe('ok');
  expect(report.recovery.rows.length).toBe(DEFAULT.height);
  expect(report.verification).toMatchObject({ mode: 'reference', exact: true, mismatchCount: 0 });
});

test('grid keyboard path: arrows move, Enter jumps to the row bytes, tooltip shows rule and confidence; list view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, DEFAULT.id);
  await page.locator('.dot[data-row="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.dot[data-row="2"]')).toBeFocused();
  await expect(page.getByTestId('grid-tip')).toHaveText(/^Row 2, run rule, confidence \d\.\d\d, bytes 0x/);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('inspector').locator('h2')).toHaveText('Row 2');
  await expect(page.locator('.hex-bytes .b.sel')).not.toHaveCount(0); // C-2: waits for the render (a one-shot count raced it on a 2-core runner)
  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.locator('.grid-list li')).toHaveCount(DEFAULT.height);
});

test('charts: tooltip on keyboard focus; reduced motion shows the same end state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, DEFAULT.id);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  const chart = page.getByRole('group', { name: /^Confidence by row chart/ });
  await chart.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('tip').first()).toHaveText(/^Row 0: confidence \d\.\d\d$/);
  expect(await page.locator('.chart-draw').first().evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.getByTestId('mismatch-count')).toHaveText('0');
});

test('phone: empty HUD hidden, then grid and verification side by side; page length', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.col-hud')).toBeHidden();
  await open(page, DEFAULT.id);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  const a = (await page.locator('.p-grid').boundingBox())!;
  const b = (await page.locator('.p-verify').boundingBox())!;
  expect(Math.abs(a.y - b.y)).toBeLessThan(4);
  expect(b.x).toBeGreaterThan(a.x + a.width - 2);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`phone page height: ${h}`);
  expect(h).toBeLessThan(1500);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SCREENS}/t17-phone-done.png`, fullPage: true });
  expect(await axe(page), 'axe 390').toEqual([]);
});
