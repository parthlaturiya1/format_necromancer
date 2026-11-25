import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const SCREENS = 'docs/verification/screens';

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

/** Records every value data-beat takes on .app, with a time, from the page's own clock. */
async function record(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __beats: [string, number][] };
    w.__beats = [];
    const app = document.querySelector('.app')!;
    const note = () => {
      const b = app.getAttribute('data-beat');
      const last = w.__beats[w.__beats.length - 1];
      if (b && (!last || last[0] !== b)) w.__beats.push([b, performance.now()]);
    };
    new MutationObserver(note).observe(app, { attributes: true, attributeFilter: ['data-beat'] });
    note();
  });
}
const beats = (page: Page) => page.evaluate(() => (window as unknown as { __beats: [string, number][] }).__beats);
const done = (page: Page) => expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 40000 });

async function play(page: Page, url: string) {
  await page.goto(url);
  await record(page);
  await page.getByRole('button', { name: 'Resurrect a sample' }).click();
  await done(page);
  return beats(page);
}

test('the six beats play in order, once each, and the run ends clean (F-01)', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  const b = await play(page, '/?speed=4');
  expect(b.map((x) => x[0])).toEqual(['1', '2', '3', '4', '5', '6']);
  await expect(page.locator('.timeline li[aria-current="step"]')).toHaveText('Proof');
  await expect(page.getByTestId('recovered-line')).toHaveText('Recovered without the format specification.');
  expect(await axe(page)).toEqual([]);
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('each beat shows its own content, taken from the engine result', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?beat=3');
  const cards = page.locator('.hcard');
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  expect(await cards.count()).toBeGreaterThanOrEqual(2);
  expect(await cards.count()).toBeLessThanOrEqual(3);
  await expect(cards.first().locator('.hc-top .mono')).toHaveText(/^\d\.\d\d$/);
  // Losers show the engine's own reason, and hovering a card lights bytes.
  await expect(cards.nth(1).locator('.hc-why')).not.toHaveText('');
  await cards.nth(1).locator('button').hover();
  expect(await page.locator('.hex-bytes .b.sel').count()).toBeGreaterThan(0);
  await page.goto('/?beat=1');
  await expect(page.locator('.hex-bytes .b.s2')).toHaveCount(0);
  await page.goto('/?beat=5&p=0.5');
  await expect(page.locator('canvas.recovered')).toHaveAttribute('data-shown', '55');
  await expect(page.getByText('Rows rebuilt 55 of 111')).toBeVisible();
  expect(await page.locator('.dots i[data-s]').count()).toBe(111);
});

test('speed 4x finishes in about a quarter of the time of 1x (F-01)', async ({ page }) => {
  test.setTimeout(90000);
  const total = async (speed: string) => {
    const b = await play(page, `/?speed=${speed}`);
    return b[b.length - 1]![1] - b[0]![1];
  };
  const fast = await total('4');
  const slow = await total('1');
  console.log('T16_SPEED ' + JSON.stringify({ ms_4x: Math.round(fast), ms_1x: Math.round(slow), ratio: +(fast / slow).toFixed(3) }));
  expect(slow).toBeGreaterThan(9000); // 0.8+1.5+2.5+1.5+4.2 = 10.5 s before beat 6 at 1x
  expect(fast).toBeLessThan(slow * 0.4);
});

test('the speed pill is a button: Enter changes it, and the choice stays for the session', async ({ page }) => {
  await page.goto('/');
  const pill = page.getByTestId('speed');
  await expect(pill).toHaveText('Speed 1x');
  await pill.focus();
  await page.keyboard.press('Enter');
  await expect(pill).toHaveText('Speed 2x');
  await page.reload();
  await expect(pill).toHaveText('Speed 2x');
});

test('reduced motion: end state of each beat, Next beat steps, Skip to result finishes (F-09)', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await record(page);
  await page.getByRole('button', { name: 'Resurrect a sample' }).click();
  await expect(page.locator('.app[data-beat="1"]')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1800); // longer than beat 1 and 2 at 1x: nothing moves on by itself
  await expect(page.locator('.app[data-beat="1"]')).toBeVisible();
  const next = page.getByRole('button', { name: 'Next beat' });
  await next.click();
  await expect(page.locator('.app[data-beat="2"]')).toBeVisible();
  await next.click();
  await expect(page.locator('.hcard').first()).toBeVisible();
  // End state of beat 3: losers are already dim, with their reason showing.
  expect(await page.locator('.hcard.lost button').first().evaluate((e) => getComputedStyle(e).opacity)).toBe('0.5');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.getByRole('button', { name: 'Skip to result' }).click();
  await done(page);
  await expect(page.getByText('Rows rebuilt 111 of 111')).toBeVisible();
  await expect(page.locator('canvas.recovered')).toHaveAttribute('data-shown', '111');
  expect(await axe(page)).toEqual([]);
  expect(seen.errors).toEqual([]);
});

test('the in-app Reduce motion switch does the same without the system setting', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('reduce-motion').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await page.getByRole('button', { name: 'Resurrect a sample' }).click();
  await expect(page.getByRole('button', { name: 'Next beat' })).toBeVisible({ timeout: 20000 });
});

test('demo mode plays the same twice: same beats, same text, same picture (F-06)', async ({ page, baseURL }) => {
  const seen = watch(page, baseURL!);
  await page.setViewportSize({ width: 1440, height: 900 });
  const once = async () => {
    await page.goto('/?demo=1&speed=4');
    await record(page);
    await done(page);
    const text = await page.locator('.stage').innerText();
    const foot = await page.locator('.foot').innerText();
    const shot = await page.locator('canvas.recovered').evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const lines = await page.locator('[data-testid="evidence-line"]').getAttribute('data-d');
    return { text, foot, shot, lines };
  };
  const a = await once();
  const b = await once();
  expect(b.text).toBe(a.text);
  expect(b.foot).toBe(a.foot);
  expect(b.shot).toBe(a.shot);
  expect(b.lines).toBe(a.lines);
  expect(seen.errors).toEqual([]);
  expect(seen.foreign).toEqual([]);
});

test('phone: timeline full width under the brand, current label centred, Speed pill 44 px (N10)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?beat=6');
  await expect(page.locator('.timeline-now')).toHaveText('Proof');
  const pill = (await page.getByTestId('speed').boundingBox())!;
  expect(pill.height).toBeGreaterThanOrEqual(44);
  const wrap = (await page.locator('.timeline-wrap').boundingBox())!;
  const brand = (await page.locator('.brand').boundingBox())!;
  expect(wrap.y).toBeGreaterThan(brand.y + brand.height - 1);
  expect(wrap.width).toBeGreaterThan(300);
  const now = (await page.locator('.timeline-now').boundingBox())!;
  expect(Math.abs(now.x + now.width / 2 - (wrap.x + wrap.width / 2))).toBeLessThan(2);
});

test('beat 5 frame rate at 1x on the default sample (numbers, not a gate)', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => {
    const w = window as unknown as { __dt: number[] };
    w.__dt = [];
    let last = 0;
    let on = false;
    const app = document.querySelector('.app')!;
    const loop = (t: number) => {
      const b = app.getAttribute('data-beat');
      if (b === '5') { if (on) w.__dt.push(t - last); on = true; last = t; } else on = false;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  await page.getByRole('button', { name: 'Resurrect a sample' }).click();
  await done(page);
  const dt = await page.evaluate(() => (window as unknown as { __dt: number[] }).__dt);
  const s = [...dt].sort((x, y) => x - y);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]!;
  const dropped = dt.filter((d) => d > 1000 / 30).length;
  const out = { frames: dt.length, p50_ms: +q(0.5).toFixed(1), p95_ms: +q(0.95).toFixed(1), fps_p50: +(1000 / q(0.5)).toFixed(1), fps_p95: +(1000 / q(0.95)).toFixed(1), dropped_over_33ms: dropped };
  console.log('T16_FPS ' + JSON.stringify(out));
  if (process.env.SHOTS) writeFileSync('docs/verification/t16-fps.json', JSON.stringify(out, null, 2) + '\n');
  expect(dt.length).toBeGreaterThan(30);
});

test('screenshots (only when SHOTS=1)', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'set SHOTS=1');
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const shot = async (url: string, name: string) => {
    await page.goto(url);
    await expect(page.locator('.app[data-beat]')).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3200); // the losers' reasons fade in last
    await page.screenshot({ path: `${SCREENS}/${name}.png` });
  };
  await shot('/?beat=3', 't16-beat3');
  await shot('/?beat=5&p=0.55', 't16-beat5');
  await shot('/?beat=6', 't16-done');
  await page.setViewportSize({ width: 390, height: 844 });
  await shot('/?beat=6', 't16-phone-done');
});

test('every sample, finished, 1440x900 (only when SHOTS=1)', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'set SHOTS=1');
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const files = readdirSync('public/samples').filter((f) => f.endsWith('.pcx'));
  for (const f of files) {
    await page.goto('/?beat=6');
    await page.getByTestId('bytes-file-input').setInputFiles(`public/samples/${f}`);
    await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${SCREENS}/samples/${f.replace('.pcx', '')}.png` });
  }
});
