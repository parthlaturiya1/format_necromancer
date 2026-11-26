import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DEFAULT } from './sample';

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

test('sample: the real engine rebuilds the picture, panels show it', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  const requested: string[] = [];
  page.on('request', (r) => requested.push(new URL(r.url()).pathname));
  await page.goto('/?speed=4'); // the ritual plays at 4x so the test waits less
  expect(requested.some((p) => p.endsWith('.png'))).toBe(false); // no reference before recovery (R-U7)
  await page.getByRole('button', { name: 'Resurrect a sample' }).click();
  const canvas = page.locator('canvas.recovered');
  await expect(canvas).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(`Rows rebuilt ${DEFAULT.height} of ${DEFAULT.height}`)).toBeVisible();
  await expect(page.getByText(/Hypothesis 1 of \d+/)).toBeVisible();
  await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
  expect(requested.some((p) => p.endsWith(`${DEFAULT.id}.png`))).toBe(true);
  // The picture is colourful (not blank): count distinct colours on the canvas.
  const colours = await canvas.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const set = new Set<number>();
    for (let i = 0; i < d.length; i += 4) set.add((d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!);
    return set.size;
  });
  expect(colours).toBeGreaterThan(4);
  // Hex: only a window of rows in the DOM, coloured from evidence.
  expect(await page.locator('.hex-row').count()).toBeLessThan(60);
  expect(await page.locator('.hex-bytes .b.s2').count()).toBeGreaterThan(0);
  await expect(page.getByRole('region', { name: new RegExp(`^Bytes of ${DEFAULT.id}\\.pcx`) })).toBeVisible();
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
  for (const [w, h] of [[1440, 900], [390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(300);
    expect(await axe(page), `axe ${w}x${h}`).toEqual([]);
  }
});

test('file input: chosen file is read and analysed, a file over 10 MB is refused', async ({ page }) => {
  await page.goto('/');
  const sample = readFileSync('public/samples/tiny-rand-7x5.pcx');
  await page.getByTestId('bytes-file-input').setInputFiles({ name: 'mine.bin', mimeType: 'application/octet-stream', buffer: sample });
  await expect(page.getByText('938 bytes', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.fileline')).toContainText('mine.bin');
  await page.getByTestId('bytes-file-input').setInputFiles({ name: 'big.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.getByText('That file is 10.0 MB. The limit is 10 MB. Nothing was read.')).toBeVisible();
});

test('keyboard: both file buttons are reachable by Tab', async ({ page }) => {
  await page.goto('/');
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    seen.add((await page.evaluate(() => document.activeElement?.textContent ?? '')).trim());
  }
  for (const n of ['Choose file', 'Resurrect a sample', 'Choose a file']) expect(seen.has(n), n).toBe(true);
});

test('1 MB file: hex keeps a small DOM and scrolls without long tasks', async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    const w = window as unknown as { __long: number[] };
    w.__long = [];
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push(e.duration))).observe({ type: 'longtask', buffered: true });
    } catch { /* longtask unsupported */ }
  });
  await page.goto('/');
  const buf = Buffer.alloc(1024 * 1024);
  let s = 99;
  for (let i = 0; i < buf.length; i++) buf[i] = (s = (s * 1103515245 + 12345) >>> 0) >>> 24;
  await page.getByTestId('bytes-file-input').setInputFiles({ name: 'one-megabyte.bin', mimeType: 'application/octet-stream', buffer: buf });
  const box = page.locator('.hexv');
  await expect(box).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => { (window as unknown as { __long: number[] }).__long.length = 0; });
  const r = await box.evaluate(async (el) => {
    const max = el.scrollHeight - el.clientHeight;
    let rowsMax = 0;
    const frames: number[] = [];
    let last = performance.now();
    const steps = 240;
    for (let i = 1; i <= steps; i++) {
      el.scrollTop = (max * i) / steps;
      await new Promise((ok) => requestAnimationFrame(() => ok(null)));
      const now = performance.now();
      frames.push(now - last);
      last = now;
      rowsMax = Math.max(rowsMax, el.querySelectorAll('.hex-row').length);
    }
    for (let i = 0; i < 3; i++) await new Promise((ok) => requestAnimationFrame(() => ok(null)));
    const lastRow = el.querySelector('.hex-row:last-child .hex-off')?.textContent ?? '';
    frames.sort((a, b) => a - b);
    return { rowsMax, totalRows: Number(el.getAttribute('data-rows')), frameP95: frames[Math.floor(frames.length * 0.95)]!, frameMax: frames[frames.length - 1]!, lastRow };
  });
  const long = await page.evaluate(() => (window as unknown as { __long: number[] }).__long);
  const longMax = long.length ? Math.max(...long) : 0;
  console.log(`1MB scroll: total rows ${r.totalRows}, max rows in DOM ${r.rowsMax}, frame p95 ${r.frameP95.toFixed(1)} ms, frame max ${r.frameMax.toFixed(1)} ms, long tasks ${long.length}, longest ${longMax.toFixed(1)} ms, last row offset ${r.lastRow}`);
  expect(r.totalRows).toBe(65536);
  expect(r.rowsMax).toBeLessThan(80);
  expect(r.lastRow).toBe('0FFFF0');
  expect(longMax).toBeLessThan(50);
});

test('screenshots of the built site after the default sample (only when SHOTS=1)', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'set SHOTS=1');
  for (const [name, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.getByRole('button', { name: 'Resurrect a sample' }).click();
    await expect(page.locator('canvas.recovered')).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `docs/verification/screens/t14-${name}.png`, fullPage: name === 'phone' });
    if (name === 'desktop') {
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'docs/verification/screens/t14-empty-desktop.png' });
    }
  }
});
