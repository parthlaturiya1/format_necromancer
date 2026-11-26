import os from 'node:os';
import { expect, test } from '@playwright/test';

// F-1: beat-5 frame intervals on real art. Opt-in (F1_FPS=1) so the normal run stays short. F1_GATE=1 turns the 55 fps bar into a failure.
const RUNS = Number(process.env.F1_RUNS ?? 3);
const IDS = ['real-abuse-end', 'rings-rand-111x111', 'real-abuse-credit'];

for (const speed of [1, 2]) {
  for (const id of IDS) {
    for (let run = 1; run <= RUNS; run++) {
      test(`F-1 beat 5 fps, ${id} at ${speed}x, run ${run}`, async ({ page }) => {
        test.skip(!process.env.F1_FPS, 'set F1_FPS=1');
        test.setTimeout(90000);
        const freeBefore = os.freemem();
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(`/?demo=1&speed=${speed}&sample=${id}`);
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
        const out = { id, speed, run, frames: dt.length, p50_ms: +q(0.5).toFixed(1), p95_ms: +q(0.95).toFixed(1), fps_p95: +(1000 / q(0.95)).toFixed(1), over_33ms: dt.filter((d) => d > 1000 / 30).length, free_gb: +(freeBefore / 2 ** 30).toFixed(1) };
        console.log('F1_FPS ' + JSON.stringify(out));
        expect(dt.length).toBeGreaterThan(30);
        if (process.env.F1_GATE) expect(out.fps_p95).toBeGreaterThanOrEqual(55);
      });
    }
  }
}
