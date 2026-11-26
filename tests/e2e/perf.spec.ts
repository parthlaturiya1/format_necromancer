// C-1 perf checks (D-10): wall-clock bars, measured as the MEDIAN of repeated runs.
// Skipped on CI (GitHub runners render in software, 2 cores), with the reason printed. Run them with `npm run perf`.
// Structural versions of these checks (row count, last row, results appear, crash thresholds) stay in panels.spec.ts and p1.spec.ts.
// PW_CPU_THROTTLE=4 runs them on a simulated slow machine; the bars do not change.
import { expect, test } from './throttle';

const RUNS = 5;
const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]!;

test.beforeEach(() => {
  if (process.env.CI && !process.env.PERF_FORCE) {
    console.log('PERF SKIPPED: CI runner renders in software; wall-clock bars are measured locally with npm run perf.');
    test.skip(true, 'CI software rendering: perf bars run locally (npm run perf)');
  }
});

test('perf: first run reaches the finished result within 9 s of the press (median of runs)', async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const times: number[] = [];
  for (let i = 0; i < 3; i++) {
    await page.goto('/');
    const start = page.getByRole('button', { name: 'Resurrect a sample' });
    await expect(start).toBeVisible();
    const t0 = Date.now();
    await start.click();
    await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 30000 });
    times.push(Date.now() - t0);
  }
  console.log(`PERF first run ms ${times.join(', ')}, median ${median(times)}`);
  expect(median(times)).toBeLessThan(9000);
});

test('perf: 1 MB hex scroll has no long task over 50 ms (median of runs)', async ({ page }) => {
  test.setTimeout(300000);
  await page.addInitScript(() => {
    const w = window as unknown as { __long: number[] };
    w.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push(e.duration))).observe({ type: 'longtask', buffered: true });
  });
  const buf = Buffer.alloc(1024 * 1024);
  let s = 99;
  for (let i = 0; i < buf.length; i++) buf[i] = (s = (s * 1103515245 + 12345) >>> 0) >>> 24;
  const longest: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    await page.goto('/');
    await page.getByTestId('bytes-file-input').setInputFiles({ name: 'one-megabyte.bin', mimeType: 'application/octet-stream', buffer: buf });
    const box = page.locator('.hexv');
    await expect(box).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => { (window as unknown as { __long: number[] }).__long.length = 0; });
    await box.evaluate(async (el) => {
      const max = el.scrollHeight - el.clientHeight;
      for (let k = 1; k <= 240; k++) {
        el.scrollTop = (max * k) / 240;
        await new Promise((ok) => requestAnimationFrame(() => ok(null)));
      }
    });
    const long = await page.evaluate(() => (window as unknown as { __long: number[] }).__long);
    longest.push(long.length ? Math.max(...long) : 0);
  }
  console.log(`PERF longest long task per run ms ${longest.map((x) => x.toFixed(0)).join(', ')}, median ${median(longest).toFixed(0)}`);
  expect(median(longest)).toBeLessThan(50);
});
