// Large valid files (T-21d). The engine must recover them exactly, under 3 s, with the work limit still on.
// Inputs are built in memory by tests/engine/helpers/pcx-fixture.ts (a test-only encoder).
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/engine/config';
import { runPipeline } from '../../src/engine/pipeline';
import { expectedRgb, makePcx, type PixelKind } from './helpers/pcx-fixture';

const MAX_MS = 3000;

const cases: Array<[string, number, number, PixelKind]> = [
  ['smooth 640x480', 640, 480, 'smooth'],
  ['smooth 3000x2000', 3000, 2000, 'smooth'],
  ['noise 800x600', 800, 600, 'noise'],
  ['noise 1600x1200', 1600, 1200, 'noise'],
  ['noise 2600x2000', 2600, 2000, 'noise'],
  ['noise near 10 MB', 3200, 2600, 'noise'],
];

describe('large valid PCX files', () => {
  for (const [name, w, h, kind] of cases) {
    it(`${name}: exact and under ${MAX_MS} ms`, () => {
      const f = makePcx(w, h, kind, 3);
      expect(f.bytes.length).toBeLessThanOrEqual(defaultConfig.maxInputBytes);
      const t = performance.now();
      const r = runPipeline(f.bytes);
      const ms = performance.now() - t;
      console.log(`large-files | ${name} | ${f.bytes.length} bytes | ${Math.round(ms)} ms | ${r.recovered.status}${r.recovered.status === 'unrecovered' ? ` | ${r.recovered.reason}` : ''}`);
      expect(ms).toBeLessThan(MAX_MS);
      expect(r.recovered.status).toBe('ok');
      if (r.recovered.status !== 'ok') return;
      expect(r.recovered.width).toBe(w);
      expect(r.recovered.height).toBe(h);
      expect(Buffer.from(r.recovered.rgb).equals(Buffer.from(expectedRgb(f)))).toBe(true);
    }, 20000);
  }
});
