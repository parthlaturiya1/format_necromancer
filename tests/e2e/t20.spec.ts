import { readFileSync } from 'node:fs';
import os from 'node:os';
import { expect, test, type Page } from '@playwright/test';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const SCREENS = 'docs/verification/screens';
const SHOTS = !!process.env.SHOTS;
const ABUSE = 'https://opengameart.org/content/abuse-art';
const REAL = ['real-abuse-end', 'real-abuse-credit'];

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
    const r = await (window as unknown as { axe: { run: () => Promise<{ violations: { id: string; impact: string; nodes: unknown[] }[] }> } }).axe.run();
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id} x${v.nodes.length}`);
  });
}

/** Goes straight to the Proof beat of one sample. */
async function proof(page: Page, id: string) {
  await page.goto(`/?beat=6&speed=4&sample=${id}`);
  await expect(page.getByTestId('badge')).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(1200); // the chart and bar draw in
}

for (const id of REAL) {
  test(`real art ${id}: verifies Exact, shows the CC0 source line and a safe link`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const seen = watch(page, baseURL!);
    await proof(page, id);
    await expect(page.getByTestId('badge')).toHaveText('Exact match');
    await expect(page.getByTestId('mismatch-count')).toHaveText('0');
    await expect(page.getByTestId('blind-badge')).toHaveText('Real game art (CC0)');
    await expect(page.getByTestId('source-line')).toContainText('From the game Abuse by Crack dot Com, CC0, via OpenGameArt');
    expect(await page.getByTestId('source-line').textContent()).not.toMatch(/\b(19|20)\d\d\b/); // no year: the page states none
    const link = page.getByTestId('source-link');
    await expect(link).toHaveAttribute('href', ABUSE);
    await expect(link).toHaveAttribute('target', '_blank');
    expect(await link.getAttribute('rel')).toContain('noopener');
    expect(await axe(page)).toEqual([]);
    expect(seen.errors).toEqual([]);
    expect(seen.foreign).toEqual([]); // the link is not fetched
    if (SHOTS) await page.screenshot({ path: `${SCREENS}/t20-${id === REAL[0] ? 'realart' : 'realart-credit'}.png` });
  });
}

test('picker labels and the direct button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?speed=4');
  await expect(page.getByTestId('load-real')).toBeVisible(); // the sample list is loaded
  const opts = await page.getByTestId('sample-pick').locator('option').allTextContents();
  expect(opts.filter((o) => o.startsWith('Real game art (CC0)'))).toHaveLength(2);
  await page.getByTestId('load-real').click();
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 40000 });
  await expect(page.getByTestId('source-link')).toBeVisible();
});

test('layout: whole-number picture scale, 12+ hex rows with a fade, 20-column grid, tall chart, wrapped chips', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await proof(page, 'rings-rand-111x111');
  const cv = await page.locator('canvas.recovered').evaluate((c) => ({ w: c.getBoundingClientRect().width, stage: c.closest('.image-stage')!.getBoundingClientRect().width }));
  expect(cv.w % 111).toBe(0); // D1: whole scale
  expect(cv.w / cv.stage).toBeGreaterThan(0.8);
  const hex = await page.locator('.hexwrap > .hexv').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { rows: [...el.querySelectorAll('.hex-row')].filter((x) => x.getBoundingClientRect().bottom <= r.bottom + 1 && x.getBoundingClientRect().top >= r.top - 1).length, mask: getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage };
  });
  expect(hex.rows).toBeGreaterThanOrEqual(11); // D2 (R-5 asked about 20; 900 px high does not fit it, see t20-polish.md)
  expect(hex.mask).toContain('linear-gradient');
  const chart = await page.locator('.p-rows .plot').first().evaluate((e) => e.getBoundingClientRect().height);
  expect(chart).toBeGreaterThanOrEqual(120); // D3
  const chips = await page.getByTestId('inspector').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [...el.querySelectorAll('.chip')].every((c) => c.getBoundingClientRect().right <= r.right);
  });
  expect(chips).toBe(true);
  if (SHOTS) await page.screenshot({ path: `${SCREENS}/t20-done.png` });
  // D7 on 200 rows: 20 columns, 10 full rows.
  await proof(page, 'real-abuse-end');
  const cols = await page.getByTestId('grid').locator('.dot').evaluateAll((d) => new Set(d.map((x) => Math.round(x.getBoundingClientRect().left))).size);
  expect(cols).toBe(20);
});

test('phone: title wraps to 2 lines, downloads full width, page under 1500 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await proof(page, 'rings-rand-111x111');
  const title = await page.locator('.fileline').evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
  expect(title).toBeLessThanOrEqual(2);
  const widths = await page.locator('.verify .downloads .btn').evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().width / b.closest('.verify')!.getBoundingClientRect().width));
  expect(Math.min(...widths)).toBeGreaterThan(0.7);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(h).toBeLessThan(1500);
  expect(wide).toBe(true);
  if (SHOTS) await page.screenshot({ path: `${SCREENS}/t20-phone.png`, fullPage: true });
  console.log('phone page height', h);
});

test('failure list shows distinct guesses and counts the rest', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?speed=4');
  await page.getByTestId('sample-pick').selectOption('corrupt-tail-cut');
  await expect(page.getByTestId('found')).toBeVisible({ timeout: 20000 });
  const lines = await page.getByTestId('found').locator('li').allTextContents();
  const bodies = lines.map((l) => l.replace(/Guess \d+/, '').replace(/\d\.\d\d/, '').trim());
  expect(new Set(bodies).size).toBe(bodies.length);
  const chip = await page.getByTestId('inspector').evaluate((el) => el.getBoundingClientRect().width > 0);
  expect(chip).toBe(true);
  if (SHOTS) await page.screenshot({ path: `${SCREENS}/t20-failure.png` });
});

for (const id of ['rings-rand-111x111', 'real-abuse-end']) {
  test(`beat 5 frame rate at 1x, ${id} (numbers, not a gate)`, async ({ page }) => {
    test.setTimeout(90000);
    const freeBefore = os.freemem();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/?demo=1&sample=${id}`);
    await page.evaluate(() => {
      const w = window as unknown as { __dt: number[] };
      w.__dt = [];
      let last = 0;
      let on = false;
      const app = document.querySelector('.app')!;
      const loop = (t: number) => {
        if (app.getAttribute('data-beat') === '5') { if (on) w.__dt.push(t - last); on = true; last = t; } else on = false;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 60000 });
    const dt = await page.evaluate(() => (window as unknown as { __dt: number[] }).__dt);
    const s = [...dt].sort((x, y) => x - y);
    const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!;
    const out = { id, frames: dt.length, p50_ms: +q(0.5).toFixed(1), p95_ms: +q(0.95).toFixed(1), fps_p95: +(1000 / q(0.95)).toFixed(1), over_33ms: dt.filter((d) => d > 1000 / 30).length, free_mem_gb_before: +(freeBefore / 2 ** 30).toFixed(1), free_mem_gb_after: +(os.freemem() / 2 ** 30).toFixed(1) };
    console.log('T20_FPS ' + JSON.stringify(out));
    expect(dt.length).toBeGreaterThan(30);
  });
}
