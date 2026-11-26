import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const SCREENS = 'docs/verification/screens';
const SHOTS = !!process.env.SHOTS;
const FAILURE_RED = 'rgb(255, 92, 108)'; // --failure

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

/** Opens a bundled sample through the picker, as a person would. */
async function pick(page: Page, id: string) {
  await page.goto('/?speed=4');
  await page.getByTestId('sample-pick').selectOption(id);
}

async function finish(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip to result' });
  await skip.click({ timeout: 8000 }).catch(() => undefined); // not shown under reduced motion or when the run is already at the end
  await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 40000 });
}

for (const reduced of [false, true]) {
  test.describe(reduced ? 'reduced motion' : 'full motion', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('corrupted sample ends unrecovered in red with the engine reason (F-08)', async ({ page, baseURL }) => {
      const seen = watch(page, baseURL!);
      await pick(page, 'corrupt-tail-cut');
      await expect(page.getByTestId('failure')).toBeVisible({ timeout: 20000 });
      const reason = (await page.getByTestId('failure-reason').textContent())!.trim();
      expect(reason.length).toBeGreaterThan(20);
      expect(reason).toContain('size numbers'); // the engine's own wording for this file
      // No picture, no fake: the recovered canvas never exists.
      await expect(page.locator('canvas.recovered')).toHaveCount(0);
      // The timeline stopped at the beat where it failed, in failure red.
      const failed = page.locator('.timeline li[data-state="failed"]');
      await expect(failed).toHaveText('Resurrection');
      await expect(page.locator('.timeline li[data-state="done"]')).toHaveCount(4);
      expect(await failed.evaluate((e) => getComputedStyle(e).color)).toBe(FAILURE_RED);
      // Verification and downloads.
      await expect(page.getByTestId('badge')).toHaveText('Nothing recovered');
      await expect(page.getByTestId('v-note')).toHaveText('Nothing recovered, nothing to check.');
      await expect(page.getByRole('button', { name: 'Download image' })).toHaveCount(0);
      const dl = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download evidence report' }).click();
      const file = await dl;
      expect(file.suggestedFilename()).toMatch(/-evidence\.json$/);
      // What was found before it failed, with the engine's own reasons.
      await expect(page.getByTestId('found')).toContainText('Guess 1');
      // Bytes: only what the engine explained is lit. For this file every piece of evidence is below the explained threshold, so every byte is dim (nothing is lit to look better).
      expect(await page.locator('.hexv .b.s0').count()).toBeGreaterThan(0);
      expect(await page.locator('.hexv .b.s2').count()).toBe(0);
      // Failure red is on the screen only because of the failure.
      expect(await page.locator('.app[data-failed]').count()).toBe(1);
      expect(await axe(page)).toEqual([]);
      expect(seen.errors).toEqual([]);
      expect(seen.foreign).toEqual([]);
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t18-failure.png` });
    });

    test('signature byte changed: a standard decoder refuses it, the engine ends Exact', async ({ page, baseURL }) => {
      const seen = watch(page, baseURL!);
      await pick(page, 'signature-changed');
      await finish(page);
      await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
      await expect(page.getByTestId('mismatch-count')).toHaveText('0');
      await expect(page.getByTestId('v-of')).toHaveText('0 of 12,321 pixels differ');
      await expect(page.getByTestId('blind-label')).toHaveText('The first byte was changed; a standard decoder refuses this file');
      await expect(page.getByTestId('blind-badge')).toHaveCount(0);
      await expect(page.locator('.app[data-failed]')).toHaveCount(0);
      const link = page.getByTestId('disclosure').getByRole('link');
      await expect(page.getByTestId('disclosure')).toContainText('Layout inferred by generic detectors; pixels by a format-aware decoder for this layout family (disclosed).');
      expect(await link.getAttribute('href')).toBe('https://github.com/parthlaturiya1/format_necromancer#the-honest-claim');
      await page.waitForTimeout(1200);
      expect(await axe(page)).toEqual([]);
      expect(seen.errors).toEqual([]);
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t18-signature.png` });
    });

    test('changed file: recovered with lower confidence, amber rows, and the truthful check', async ({ page, baseURL }) => {
      const seen = watch(page, baseURL!);
      await pick(page, 'changed-lower-confidence');
      await finish(page);
      await expect(page.getByTestId('blind-label')).toContainText('lower confidence');
      expect(await page.locator('.dots i[data-s="uncertain"]').count()).toBeGreaterThan(0);
      await expect(page.getByTestId('badge')).toHaveText(/Exact match|Not exact/, { timeout: 20000 });
      await page.waitForTimeout(1200);
      expect(seen.errors).toEqual([]);
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t18-lowconf.png` });
    });

    test('a random-bytes user file ends unrecovered with a reason', async ({ page, baseURL }) => {
      const seen = watch(page, baseURL!);
      await page.goto('/?speed=4');
      let s = 20261125;
      const buffer = Buffer.alloc(3000);
      for (let i = 0; i < buffer.length; i++) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; buffer[i] = s >>> 24; }
      await page.getByTestId('bytes-file-input').setInputFiles({ name: 'noise.bin', mimeType: 'application/octet-stream', buffer });
      await expect(page.getByTestId('failure')).toBeVisible({ timeout: 20000 });
      expect((await page.getByTestId('failure-reason').textContent())!.trim().length).toBeGreaterThan(20);
      await expect(page.getByTestId('badge')).toHaveText('Nothing recovered');
      expect(await axe(page)).toEqual([]);
      expect(seen.errors).toEqual([]);
    });
  });
}

test('the blind test has a direct button and a badge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?speed=4');
  await page.getByTestId('load-blind').click();
  await finish(page);
  await expect(page.getByTestId('blind-badge')).toHaveText('Blind test');
  expect(await page.getByTestId('blind-badge').evaluate((e) => getComputedStyle(e).color)).not.toBe('rgb(255, 180, 84)'); // never the amber of "uncertain"
  await expect(page.getByTestId('v-of')).toHaveText('0 of 13,500 pixels differ');
});

test('phone: the failure screen fits and reads', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?speed=4');
  await page.getByTestId('sample-pick').selectOption('corrupt-tail-cut');
  await expect(page.getByTestId('failure')).toBeVisible({ timeout: 20000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await axe(page)).toEqual([]);
  if (SHOTS) await page.screenshot({ path: `${SCREENS}/t18-phone-failure.png`, fullPage: true });
});

test('picture scale: the whole-number size is the largest that fits (F7)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [id, w, h] of [['text-fire-160x32', 160, 32], ['rings-rand-111x111', 111, 111], ['tiny-rand-7x5', 7, 5]] as const) {
    await page.goto('/?speed=4');
    await page.getByTestId('sample-pick').selectOption(id);
    await finish(page);
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const cv = document.querySelector<HTMLCanvasElement>('canvas.recovered')!;
      const box = document.querySelector('.canvas-wrap')!.getBoundingClientRect();
      return { cw: cv.getBoundingClientRect().width, ch: cv.getBoundingClientRect().height, bw: box.width, bh: box.height };
    });
    const k = Math.round(m.cw / w);
    expect(m.cw).toBeCloseTo(w * k, 0);
    expect(m.ch).toBeCloseTo(h * k, 0);
    // One step larger would not fit the box (frame padding included, 36 px).
    expect((w * (k + 1) > m.bw - 36) || (h * (k + 1) > m.bh - 36)).toBe(true);
    console.log(`SCALE ${id} ${k}x canvas ${m.cw}x${m.ch} box ${m.bw.toFixed(0)}x${m.bh.toFixed(0)}`);
  }
});
