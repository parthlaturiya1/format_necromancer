import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/engine/config';
import { detectPalette } from '../../src/engine/detectors/palette';
import { detectRepetition } from '../../src/engine/detectors/repetition';
import { detectRunPairs } from '../../src/engine/detectors/run-length';
import { detectTables } from '../../src/engine/detectors/table-like';

const cfg = defaultConfig;
// Fixed pseudo-random bytes (xorshift), so tests are deterministic without a library.
const noise = (n: number, seed = 12345): Uint8Array => {
  const out = new Uint8Array(n);
  let s = seed;
  for (let i = 0; i < n; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    out[i] = s & 0xff;
  }
  return out;
};

describe('repetition', () => {
  it('finds a run of one byte with exact bounds', () => {
    const b = noise(100);
    b.fill(7, 30, 60);
    const r = detectRepetition(b, cfg);
    expect(r).toContainEqual({ kind: 'byte-run', range: { start: 30, end: 60 }, value: 7 });
  });
  it('finds a back-to-back repeated block', () => {
    const b = noise(120);
    for (let i = 0; i < 40; i++) b[20 + i] = [9, 1, 5, 200][i % 4]!;
    const r = detectRepetition(b, cfg).filter((c) => c.kind === 'structure');
    expect(r.length).toBe(1);
    expect(r[0]!.range.start).toBeLessThanOrEqual(20);
    expect(r[0]!.range.end).toBeGreaterThanOrEqual(56);
  });
  it('finds nothing in short or empty input', () => {
    expect(detectRepetition(new Uint8Array(0), cfg)).toEqual([]);
    expect(detectRepetition(Uint8Array.of(1, 2, 3), cfg)).toEqual([]);
  });
});

describe('run-length', () => {
  it('scores count-value pairs and ignores random bytes', () => {
    const b = new Uint8Array(400);
    for (let i = 0; i < 400; i += 4) b.set([0xe0 | (i & 15), 5, 3, 4], i);
    const r = detectRunPairs(b, cfg);
    expect(r.some((c) => c.prefixBits === 3 && c.followShare === 1)).toBe(true);
    expect(detectRunPairs(noise(4000), cfg)).toEqual([]);
  });
  it('returns nothing for empty input', () => {
    expect(detectRunPairs(new Uint8Array(0), cfg)).toEqual([]);
  });
});

describe('palette', () => {
  it('finds a smooth block of distinct entries at an arbitrary offset', () => {
    const b = noise(2000);
    for (let e = 0; e < 64; e++) b.set([e * 3, 255 - e * 2, 10 + e], 301 + e * 3);
    const r = detectPalette(b, cfg);
    const planted = { start: 301, end: 301 + 64 * 3 };
    const overlap = (c: { range: { start: number; end: number } }) => Math.min(c.range.end, planted.end) - Math.max(c.range.start, planted.start);
    expect(r.some((c) => overlap(c) >= 0.75 * (planted.end - planted.start))).toBe(true);
  });
  it('rejects random bytes and a constant block', () => {
    expect(detectPalette(noise(3000), cfg)).toEqual([]);
    expect(detectPalette(new Uint8Array(3000), cfg)).toEqual([]);
  });
});

describe('table-like', () => {
  it('finds fixed-width records with some fixed and some changing columns', () => {
    const b = noise(1200);
    for (let r = 0; r < 60; r++) b.set([1, 2, 3, r, 9, r * 2 & 255, 4, 4], 100 + r * 8);
    const t = detectTables(b, cfg);
    expect(t.some((c) => c.range.start <= 300 && c.range.end >= 400)).toBe(true);
  });
  it('rejects random bytes', () => {
    expect(detectTables(noise(2000), cfg)).toEqual([]);
  });
});

