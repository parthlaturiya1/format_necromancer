import { readFileSync } from 'node:fs';
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

async function openSample(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Resurrect a sample' }).click();
  await expect(page.locator('canvas.recovered')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('inspector').locator('h2')).not.toHaveText('No region selected');
}

/** Click the middle of row `r` of the picture. */
async function clickRow(page: Page, r: number, height = 111) {
  const box = (await page.locator('canvas.recovered').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + ((r + 0.5) / height) * box.height);
}

test('a region is picked when the run ends, with its card, lit bytes and a line (N7)', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSample(page);
  await expect(page.getByTestId('inspector')).toContainText(/Bytes 0x[0-9A-F]{4} to 0x[0-9A-F]{4}/);
  expect(await page.locator('.hex-bytes .b.sel').count()).toBeGreaterThan(0);
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('click a row: bytes lit, line drawn, card text right; click a byte: its row is selected', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSample(page);
  await clickRow(page, 7);
  const card = page.getByTestId('inspector');
  await expect(card.locator('h2')).toHaveText('Row 7');
  await expect(card).toContainText('Rule: run rule.');
  await expect(card).toContainText(/Bytes 0x[0-9A-F]{4} to 0x[0-9A-F]{4}.* Confidence \d\.\d\d/);
  await expect(page.getByTestId('announce')).toHaveText(/^Row 7, run rule, confidence \d\.\d\d, bytes 0x[0-9A-F]{4} to 0x[0-9A-F]{4}$/);
  const lit = page.locator('.hex-bytes .b.sel');
  expect(await lit.count()).toBeGreaterThan(0);
  // The line: a cubic path that starts at the bytes (left) and ends at the picture's left edge, 1.5 px wide.
  const line = page.locator('[data-testid="evidence-line"] path.l3-line');
  await expect(line).toHaveCount(1);
  const d = (await line.getAttribute('d'))!;
  expect(d).toMatch(/^M[\d.]+,[\d.]+ C/);
  expect(await line.evaluate((e) => getComputedStyle(e).strokeWidth)).toBe('1.5px');
  expect(await page.locator('.l3-row').count()).toBe(1);
  // Pick another row, then click one of the first row's lit bytes: row 7 comes back.
  const off = await lit.first().getAttribute('data-o');
  await clickRow(page, 20);
  await expect(card.locator('h2')).toHaveText('Row 20');
  await clickRow(page, 7);
  await page.locator(`.hex-bytes .b[data-o="${off}"]`).click();
  await expect(card.locator('h2')).toHaveText('Row 7');
  // A header byte gives a layout region, no row outline.
  await page.locator('.hexv').evaluate((e) => { e.scrollTop = 0; });
  await page.locator('.hex-bytes .b[data-o="0"]').click();
  await expect(card.locator('h2')).toHaveText(/header/i);
  await expect(card).toContainText('Part of the layout');
  expect(await page.locator('.hex-bytes .b.sel').count()).toBeGreaterThan(0);
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('the line follows scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSample(page);
  await clickRow(page, 7);
  const line = page.locator('[data-testid="evidence-line"] path.l3-line');
  const before = await line.getAttribute('d');
  await page.locator('.hexv').evaluate((e) => { e.scrollTop += 11; });
  await expect.poll(async () => line.getAttribute('d')).not.toBe(before);
});

test('keyboard only: rows, regions, focus moves to the card, Escape clears', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSample(page);
  const list = page.getByTestId('row-list');
  await list.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await expect(list).toHaveAttribute('aria-activedescendant', 'row-opt-3');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('inspector')).toBeFocused();
  await expect(page.getByTestId('inspector').locator('h2')).toHaveText('Row 3');
  await expect(page.getByTestId('announce')).toHaveText(/^Row 3, run rule, confidence/);
  // Regions are buttons in the card.
  const chip = page.getByRole('button', { name: /header/i }).first();
  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('inspector').locator('h2')).toHaveText(/header/i);
  await expect(page.getByTestId('inspector')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('inspector').locator('h2')).toHaveText('No region selected');
  // Focus ring is visible on the row list.
  await list.focus();
  expect(await list.evaluate((e) => getComputedStyle(e).outlineStyle)).not.toBe('none');
});

test('reduced motion: the line is drawn at once, no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSample(page);
  await clickRow(page, 7);
  const line = page.locator('[data-testid="evidence-line"] path.l3-line');
  await expect(line).toHaveCount(1);
  expect(await line.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('motion on: the line draws in with a dash offset animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await openSample(page);
  await clickRow(page, 7);
  const line = page.locator('[data-testid="evidence-line"] path.l3-line');
  expect(await line.evaluate((e) => getComputedStyle(e).animationName)).toBe('draw');
});

test('phone: highlight only, no cross-panel line; axe clean at both sizes', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 390, height: 844 });
  await openSample(page);
  await clickRow(page, 7);
  await expect(page.getByTestId('inspector').locator('h2')).toHaveText('Row 7');
  expect(await page.locator('[data-testid="evidence-line"]').count()).toBe(0);
  expect(await page.locator('.hex-bytes .b.sel').count()).toBeGreaterThan(0);
  await expect(page.locator('.l3-row')).toHaveCount(1);
  expect(await axe(page), 'axe 390').toEqual([]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  expect(await axe(page), 'axe 1440').toEqual([]);
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('screenshots with a selection active (only when SHOTS=1)', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'set SHOTS=1');
  for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await openSample(page);
    await clickRow(page, 7);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `docs/verification/screens/t15-${name}.png`, fullPage: name === 'phone' });
  }
});
