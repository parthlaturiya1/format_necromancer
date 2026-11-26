// T-19 golden run (demo.md A, steps 1-6) as one test per viewport and motion setting.
// Runs against the built out/ (default config) or any URL: BASE_URL=https://... npx playwright test -c tests/e2e/live.config.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DEFAULT } from './sample';

const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const OUT = process.env.T19_OUT ?? 'local';
const SHOTS = !!process.env.SHOTS;
const SCREENS = 'docs/verification/screens';
const FAILURE_RED = 'rgb(255, 92, 108)';
const LIVE = !!process.env.BASE_URL;

type Req = { url: string; t: number; origin: boolean };
type Run = Record<string, unknown>;
const signatures: Record<string, Run> = {};

function watch(page: Page, baseURL: string) {
  const errors: string[] = [];
  const foreign: string[] = [];
  const reqs: Req[] = [];
  let t0 = Date.now();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    const u = r.url();
    const origin = u.startsWith(baseURL);
    if (!origin && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(u);
    reqs.push({ url: u.replace(baseURL, ''), t: Date.now() - t0, origin });
  });
  return { errors, foreign, reqs, mark: () => { t0 = Date.now(); reqs.length = 0; } };
}

async function axe(page: Page, label: string, into: string[]) {
  await page.evaluate(AXE);
  const v = await page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: () => Promise<{ violations: { id: string; impact: string; nodes: unknown[] }[] }> } }).axe.run();
    return r.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length }));
  });
  const bad = v.filter((x) => x.impact === 'serious' || x.impact === 'critical');
  into.push(`${label}: ${v.length} violations, ${bad.length} serious/critical${v.length ? ' ' + JSON.stringify(v) : ''}`);
  return bad;
}

async function recordBeats(page: Page) {
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

for (const reduced of [false, true]) {
  for (const [w, h] of [[1440, 900], [390, 844]] as const) {
    const name = `golden run ${w}x${h} ${reduced ? 'reduced motion' : 'full motion'}`;
    test(name, async ({ page, baseURL }) => {
      test.setTimeout(150000);
      const log: string[] = [];
      const axeBad: string[] = [];
      const seen = watch(page, baseURL!);
      const tag = `${OUT}-${w}-${reduced ? 'rm' : 'fm'}`;
      const nums: Run = { viewport: `${w}x${h}`, reduced };
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: w, height: h });

      // Step 1: within 10 s the dead sample is on screen as bytes, with the one start button.
      const tNav = Date.now();
      await page.goto('/');
      const start = page.getByRole('button', { name: 'Resurrect a sample' });
      await expect(start).toBeVisible({ timeout: 10000 });
      nums.ms_to_start_button = Date.now() - tNav;
      await expect(page.locator('.hexv, .hex-bytes').first()).toBeVisible({ timeout: 10000 });
      nums.bytes_on_screen_before_press = (await page.locator('.hex-bytes .b').count()) > 0;
      await page.evaluate(() => document.fonts.ready);
      bad(await axe(page, 'axe idle', log));
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t19-${tag}-1-idle.png` });
      await recordBeats(page);

      // Step 2: press it. From here nothing may leave the page except the same-origin sample and its reference.
      seen.mark();
      const tPress = Date.now();
      await start.click();
      if (reduced) {
        await expect(page.locator('.app[data-beat="1"]')).toBeVisible({ timeout: 20000 });
        const next = page.getByRole('button', { name: 'Next beat' });
        for (let i = 0; i < 6; i++) {
          if (await page.locator('.app[data-ritual="done"]').count()) break;
          await next.click({ timeout: 3000 }).catch(() => undefined);
          await page.waitForTimeout(150);
        }
      }
      await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 40000 });
      nums.ms_press_to_done = Date.now() - tPress;
      const beats = await page.evaluate(() => (window as unknown as { __beats: [string, number][] }).__beats);
      nums.beats = beats.map((b) => b[0]).join(',');
      if (!reduced) {
        nums.ms_beat1_to_beat6 = Math.round(beats[beats.length - 1]![1] - beats[0]![1]);
        expect(beats.map((b) => b[0])).toEqual(['1', '2', '3', '4', '5', '6']);
      } else {
        expect(beats.map((b) => b[0]).slice(-1)).toEqual(['6']);
      }
      await expect(page.getByTestId('recovered-line')).toHaveText('Recovered without the format specification.');
      // Network during analysis: list everything requested after the press.
      const after = seen.reqs.map((r) => `${r.t}ms ${r.url}`);
      nums.requests_after_press = after;
      for (const r of seen.reqs) {
        expect(r.origin, `cross-origin request ${r.url}`).toBe(true);
        expect(/^\/samples\/[^/]+\.(pcx|png)$|^\/samples\/index\.json$/.test(r.url), `unexpected request after press: ${r.url}`).toBe(true);
      }
      const pcxAt = seen.reqs.find((r) => r.url.endsWith('.pcx'))?.t ?? -1;
      const pngAt = seen.reqs.find((r) => r.url.endsWith('.png'))?.t ?? -1;
      nums.ms_sample_fetch_after_press = pcxAt;
      nums.ms_reference_fetch_after_press = pngAt;
      expect(pcxAt).toBeGreaterThanOrEqual(0);
      expect(pngAt, 'reference PNG only after the sample was read').toBeGreaterThan(pcxAt);
      expect(seen.reqs.filter((r) => r.url.endsWith('.png')).length).toBe(1);
      expect(seen.reqs.filter((r) => r.url.endsWith('.pcx')).length).toBe(1);
      await page.waitForTimeout(1300);
      bad(await axe(page, 'axe done', log));
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t19-${tag}-2-done.png`, fullPage: w < 700 });

      // Step 2b: uncertain rows (if any) and the grid.
      const dots = await page.locator('.dots i[data-s]').count();
      const uncertain = await page.locator('.dots i[data-s="uncertain"]').count();
      nums.grid_dots = dots;
      nums.uncertain_dots = uncertain;
      expect(dots).toBeGreaterThan(0);
      const lit = await page.locator('.dots i[data-s="ok"], .dots i[data-s="confident"]').count();
      nums.grid_dots_confident = lit;
      const states = await page.locator('.dots i[data-s]').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-s')))]);
      nums.grid_states = states.join(',');

      // Step 3: click a row. Bytes light, a line connects (not on a phone, by design), rule and confidence shown.
      const canvas = page.locator('canvas.recovered');
      const box = (await canvas.boundingBox())!;
      const rows = Number(await canvas.getAttribute('data-shown'));
      const r = 7;
      await page.mouse.click(box.x + box.width / 2, box.y + ((r + 0.5) / rows) * box.height);
      const card = page.getByTestId('inspector');
      await expect(card.locator('h2')).toHaveText(`Row ${r}`);
      await expect(card).toContainText(/Rule: .+\./);
      await expect(card).toContainText(/Confidence \d\.\d\d/);
      await expect(page.locator('.hex-bytes .b.sel')).not.toHaveCount(0); // C-2: waits for the render (a one-shot count raced it on a 2-core runner)
      nums.lit_bytes = await page.locator('.hex-bytes .b.sel').count();
      if (w >= 760) {
        await expect(page.locator('[data-testid="evidence-line"] path.l3-line')).toHaveCount(1);
        nums.line = 'drawn';
      } else {
        expect(await page.locator('[data-testid="evidence-line"]').count()).toBe(0);
        await expect(page.locator('.l3-row')).toHaveCount(1);
        nums.line = 'none on phone (highlight only, by design)';
      }
      await page.waitForTimeout(500);
      bad(await axe(page, 'axe row selected', log));
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t19-${tag}-3-inspect.png`, fullPage: w < 700 });

      // Step 4: verification: exact, zero mismatches, blind file loadable and labelled.
      await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
      await expect(page.getByTestId('mismatch-count')).toHaveText('0');
      nums.v_of = await page.getByTestId('v-of').innerText();
      nums.badge = await page.getByTestId('badge').innerText();
      nums.rows_text = (await page.getByText(/Rows rebuilt \d+ of \d+/).first().innerText().catch(() => ''));
      nums.canvas_png_len = (await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).length;
      await page.getByTestId('load-blind').click();
      await expect(page.locator('.app[data-ritual="done"]')).toBeVisible({ timeout: 40000 }).catch(() => undefined);
      const skip = page.getByRole('button', { name: 'Skip to result' });
      await skip.click({ timeout: 1500 }).catch(() => undefined);
      await expect(page.getByTestId('blind-badge')).toHaveText('Blind test', { timeout: 40000 });
      await expect(page.getByTestId('blind-label')).toContainText('Held-out file');
      await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 20000 });
      await expect(page.getByTestId('mismatch-count')).toHaveText('0');
      nums.blind_v_of = await page.getByTestId('v-of').innerText();
      expect(nums.blind_v_of).toBe('0 of 13,500 pixels differ');
      await page.waitForTimeout(1300);
      bad(await axe(page, 'axe blind test', log));
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t19-${tag}-4-blind.png`, fullPage: w < 700 });

      // Step 5: corrupted copy: unrecovered, failure red, reason in words, no crash.
      await page.getByTestId('sample-pick').selectOption('corrupt-tail-cut');
      await expect(page.getByTestId('failure')).toBeVisible({ timeout: 20000 });
      const reason = (await page.getByTestId('failure-reason').textContent())!.trim();
      expect(reason.length).toBeGreaterThan(20);
      nums.failure_reason = reason;
      await expect(page.getByTestId('badge')).toHaveText('Nothing recovered');
      await expect(page.locator('canvas.recovered')).toHaveCount(0);
      const failed = page.locator('.timeline li[data-state="failed"]');
      await expect(failed).toHaveText('Resurrection');
      expect(await failed.evaluate((e) => getComputedStyle(e).color)).toBe(FAILURE_RED);
      expect(await page.locator('.app[data-failed]').count()).toBe(1);
      await page.waitForTimeout(800);
      bad(await axe(page, 'axe failure', log));
      if (SHOTS && !reduced) await page.screenshot({ path: `${SCREENS}/t19-${tag}-5-failure.png`, fullPage: w < 700 });
      // The page is still alive: load the good sample again.
      await page.getByTestId('sample-pick').selectOption(DEFAULT.id);
      await page.getByRole('button', { name: 'Skip to result' }).click({ timeout: 8000 }).catch(() => undefined);
      await expect(page.getByTestId('badge')).toHaveText('Exact match', { timeout: 60000 });

      // Whole session: nothing left the origin, console clean.
      nums.axe = log;
      nums.console_errors = seen.errors.length;
      nums.foreign_requests = seen.foreign.length;
      signatures[tag] = nums;
      mkdirSync('test-results', { recursive: true });
      writeFileSync(`test-results/t19-${tag}.json`, JSON.stringify(nums, null, 2));
      console.log('T19 ' + JSON.stringify(nums));
      expect(seen.foreign).toEqual([]);
      expect(seen.errors).toEqual([]);
      expect(axeBad).toEqual([]);

      function bad(list: unknown[]) { axeBad.push(...(list.map(String))); }
    });
  }
}

test('reduced motion shows the same information as full motion (step 6)', async () => {
  for (const [w] of [[1440], [390]] as const) {
    const a = signatures[`${OUT}-${w}-fm`];
    const b = signatures[`${OUT}-${w}-rm`];
    test.skip(!a || !b, 'needs both runs of this file in one process');
    for (const k of ['badge', 'v_of', 'blind_v_of', 'grid_dots', 'uncertain_dots', 'grid_states', 'rows_text', 'canvas_png_len', 'failure_reason']) {
      expect(b![k], `${k} at ${w}`).toEqual(a![k]);
    }
  }
});

test.afterAll(() => { if (LIVE) void 0; });
