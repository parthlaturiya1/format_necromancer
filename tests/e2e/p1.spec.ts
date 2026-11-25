// P-1 first impression: default is real art, first run is quick, the promise line, no text past a card edge, refuses-vs-recovers panel.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DEFAULT } from './sample';

const SCREENS = 'docs/verification/screens';
const SHOTS = !!process.env.SHOTS;
const PROMISE = 'Recovers a dead file from its bytes alone. No specification. Nothing uploaded.';
const index = JSON.parse(readFileSync('public/samples/index.json', 'utf8')) as { samples: { id: string; refusal?: string; refusalSource?: string }[] };

test('default sample is real game art, the promise line sits under the title', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  expect(DEFAULT.id).toBe('real-abuse-end');
  await expect(page.getByTestId('promise')).toHaveText(PROMISE);
  await expect(page.locator('.lock')).toHaveText('Runs in your browser. Nothing is uploaded.');
  const [h1, p] = await Promise.all([page.locator('h1').boundingBox(), page.getByTestId('promise').boundingBox()]);
  expect(p!.y).toBeGreaterThanOrEqual(h1!.y + h1!.height - 1);
  expect(p!.y + p!.height).toBeLessThan(900);
  await expect(page.getByTestId('speed')).toHaveText('Speed 2x');
  await expect(page.getByRole('button', { name: 'Resurrect a sample' })).toBeVisible();
  if (SHOTS) { await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: `${SCREENS}/p1-first.png` }); }
});

test('first run: finished result within 9 s of the press, Skip to result visible during the run, 1x still available', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Resurrect a sample' });
  await expect(start).toBeVisible();
  const t0 = Date.now();
  await start.click();
  const skip = page.getByRole('button', { name: 'Skip to result' });
  await expect(skip).toBeVisible({ timeout: 5000 });
  const box = (await skip.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(900);
  expect(box.height).toBeGreaterThanOrEqual(30);
  for (let b = 1; b <= 6; b++) await expect(page.locator(`.app[data-beat="${b}"]`)).toBeVisible({ timeout: 12000 }); // all six beats play
  await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 15000 });
  const ms = Date.now() - t0;
  console.log('P1_TIME_TO_DONE_MS ' + ms);
  expect(ms).toBeLessThan(9000);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 10000 });
  if (SHOTS) { await page.waitForTimeout(1200); await page.screenshot({ path: `${SCREENS}/p1-done.png` }); }
  // 1x is reachable: 2 -> 4 -> 0.5 -> 1
  for (let i = 0; i < 3; i++) await page.getByTestId('speed').click();
  await expect(page.getByTestId('speed')).toHaveText('Speed 1x');
});

test('signature-changed: a standard decoder refuses, Format Necromancer recovers, with the real Pillow text', async ({ page }) => {
  test.setTimeout(60000);
  const s = index.samples.find((x) => x.id === 'signature-changed')!;
  expect(s.refusal).toMatch(/cannot identify image file/);
  expect(s.refusalSource).toBe('Pillow 13.0.0, a widely used image library');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByTestId('sample-pick').selectOption('signature-changed');
  await page.getByRole('button', { name: 'Skip to result' }).click({ timeout: 8000 }).catch(() => undefined);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 30000 });
  const v = page.getByTestId('versus');
  await expect(v).toBeVisible();
  await expect(v).toContainText('A standard decoder');
  await expect(v).toContainText('refuses this file');
  await expect(v).toContainText('Format Necromancer');
  await expect(v).toContainText('recovered, exact');
  await expect(page.getByTestId('vs-refusal')).toHaveText(s.refusal!);
  await expect(v).toContainText('Pillow 13.0.0, a widely used image library');
  if (SHOTS) { await page.waitForTimeout(800); await page.screenshot({ path: `${SCREENS}/p1-signature.png` }); }
  // not shown for the default sample
  await page.getByTestId('sample-pick').selectOption(DEFAULT.id);
  await page.getByRole('button', { name: 'Skip to result' }).click({ timeout: 8000 }).catch(() => undefined);
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 30000 });
  await expect(page.getByTestId('versus')).toHaveCount(0);
});

/** Every text node, button and bar inside each card must lie within the card's content box (border and padding excluded). */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const bad: string[] = [];
    for (const card of document.querySelectorAll('.panel')) {
      const cs = getComputedStyle(card);
      const r = card.getBoundingClientRect();
      const left = r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
      const right = r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
      const name = card.getAttribute('aria-labelledby') ?? card.className;
      const check = (rect: DOMRect, what: string) => {
        if (rect.width === 0 || rect.height === 0) return;
        if (rect.left < left - 0.5 || rect.right > right + 0.5) bad.push(`${name}: ${what} ${rect.left.toFixed(1)}..${rect.right.toFixed(1)} outside ${left.toFixed(1)}..${right.toFixed(1)}`);
      };
      for (const el of card.querySelectorAll('button, .bar, .v-bar, .badge, a')) check(el.getBoundingClientRect(), `<${el.tagName.toLowerCase()}> ${(el.textContent ?? '').trim().slice(0, 24)}`);
      const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent ?? '';
        if (!t.trim()) continue;
        const parent = (n as Text).parentElement!;
        if (parent.closest('.sr-only, .hexv, [aria-hidden="true"]')) continue; // the hex view scrolls on purpose
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const rect of range.getClientRects()) check(rect, `"${t.trim().slice(0, 24)}"`);
      }
    }
    return bad;
  });
}

for (const [w, h] of [[1440, 900], [1280, 800], [390, 844]] as const) {
  for (const sample of ['real-abuse-end', 'corrupt-tail-cut', 'signature-changed']) {
    test(`no text or button past a card edge, ${sample}, ${w}x${h}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/?beat=6&speed=4&sample=${sample}`);
      await expect(page.getByTestId(sample === 'corrupt-tail-cut' ? 'found' : 'badge')).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(1200);
      expect(await overflow(page)).toEqual([]);
      if (SHOTS && sample === 'real-abuse-end' && w === 390) await page.screenshot({ path: `${SCREENS}/p1-phone.png`, fullPage: true });
      if (w === 390 && sample === 'real-abuse-end') expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(1500);
    });
  }
}
