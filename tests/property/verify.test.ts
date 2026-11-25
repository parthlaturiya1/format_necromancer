// T-09 properties (fixed seed): verify(x, x) is exact; k flipped pixels give mismatchCount k; PNG encode/decode round trips.
import { deflateSync } from 'node:zlib';
import fc from 'fast-check';
import { expect, it } from 'vitest';
import { decodePng, encodePng } from '../../src/engine/png';
import type { Recovered } from '../../src/engine/recover';
import { verify } from '../../src/engine/verify';
import { nodeInflate } from '../engine/helpers/node-inflate';

const opts = { seed: 20261125, numRuns: 100 };
const imageArb = fc
  .tuple(fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 12 }))
  .chain(([w, h]) => fc.uint8Array({ minLength: w * h * 3, maxLength: w * h * 3 }).map((rgb) => ({ width: w, height: h, rgb })));
const rec = (i: { width: number; height: number; rgb: Uint8Array }): Recovered => ({ status: 'ok', ...i, rows: [], evidence: [], hypothesisId: 'h', confidence: 1 });

it('verify(x, x) is exact with 0 mismatches', () => {
  fc.assert(
    fc.property(imageArb, (i) => {
      const v = verify(rec(i), { ...i, rgb: i.rgb.slice() });
      expect(v).toEqual({ mode: 'reference', exact: true, mismatchCount: 0, mismatches: [] });
    }),
    opts,
  );
});

it('flipping k distinct pixels gives mismatchCount k', () => {
  fc.assert(
    fc.property(imageArb, fc.nat(), (i, seedK) => {
      const n = i.width * i.height;
      const k = seedK % (n + 1);
      const ref = { ...i, rgb: i.rgb.slice() };
      const changed = rec({ ...i, rgb: i.rgb.slice() });
      if (changed.status !== 'ok') return;
      for (let p = 0; p < k; p++) changed.rgb[p * 3] = (changed.rgb[p * 3]! + 1) & 255; // first k pixels, always different
      const v = verify(changed, ref);
      expect(v.mode === 'reference' && v.mismatchCount).toBe(k);
      expect(v.mode === 'reference' && v.exact).toBe(k === 0);
    }),
    opts,
  );
});

it('PNG encode then decode returns the same pixels', async () => {
  await fc.assert(
    fc.asyncProperty(imageArb, async (i) => {
      const png = await encodePng(i.width, i.height, i.rgb, async (d) => new Uint8Array(deflateSync(d)));
      const back = await decodePng(png, nodeInflate);
      expect([back.width, back.height]).toEqual([i.width, i.height]);
      expect(Buffer.from(back.rgb).equals(Buffer.from(i.rgb))).toBe(true);
    }),
    opts,
  );
});
