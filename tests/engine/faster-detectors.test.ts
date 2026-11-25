// T-21d: the faster detectors must give the same answers as the versions at commit 2371568 (kept in helpers/ref).
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/engine/config';
import { detectHeaderBlocks } from '../../src/engine/detectors/header-block';
import { detectPalette } from '../../src/engine/detectors/palette';
import { detectRepetition } from '../../src/engine/detectors/repetition';
import { makePcx, makeRng } from './helpers/pcx-fixture';
import { detectHeaderBlocks as refHeader } from './helpers/ref/header-block';
import { detectPalette as refPalette } from './helpers/ref/palette';
import { detectRepetition as refRepetition } from './helpers/ref/repetition';

/** Deterministic inputs of many shapes: pcx files, noise, repeats, ramps, runs, tiny and odd sizes. */
function inputs(): Array<[string, Uint8Array]> {
  const out: Array<[string, Uint8Array]> = [];
  const rng = makeRng(11);
  for (const [w, h, k] of [[40, 30, 'smooth'], [64, 20, 'noise'], [200, 100, 'smooth'], [31, 17, 'noise']] as const) out.push([`pcx ${w}x${h} ${k}`, makePcx(w, h, k, 5).bytes]);
  for (const n of [16, 17, 100, 600, 700, 800, 1500, 4096]) {
    out.push([`noise ${n}`, Uint8Array.from({ length: n }, () => rng() & 0xff)]);
    out.push([`no markers ${n}`, Uint8Array.from({ length: n }, () => rng() & 0x3f)]);
    out.push([`period 5 ${n}`, Uint8Array.from({ length: n }, (_, i) => ((i % 5) * 37 + (i % 97 === 0 ? 1 : 0)) & 0x7f)]);
    out.push([`ramp ${n}`, Uint8Array.from({ length: n }, (_, i) => (i * 3) & 0xff)]);
    out.push([`pairs ${n}`, Uint8Array.from({ length: n }, (_, i) => (i % 2 === 0 ? 0xc0 | (1 + (rng() % 63)) : rng() & 0x7f))]);
    out.push([`mixed ${n}`, Uint8Array.from({ length: n }, (_, i) => (i < n / 2 ? 0x41 : rng() & 0xff))]);
    out.push([`zeros ${n}`, new Uint8Array(n)]);
  }
  return out;
}

describe('T-21d faster detectors equal the old ones', () => {
  for (const [name, bytes] of inputs()) {
    it(name, () => {
      expect(detectHeaderBlocks(bytes, defaultConfig)).toEqual(refHeader(bytes, defaultConfig));
      expect(detectRepetition(bytes, defaultConfig)).toEqual(refRepetition(bytes, defaultConfig));
      expect(detectPalette(bytes, defaultConfig)).toEqual(refPalette(bytes, defaultConfig));
    });
  }
});
