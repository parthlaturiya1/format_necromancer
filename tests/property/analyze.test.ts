import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { analyze } from '../../src/engine/analyze';
import { defaultConfig } from '../../src/engine/config';
import { detectPalette } from '../../src/engine/detectors/palette';
import { detectRepetition } from '../../src/engine/detectors/repetition';
import { detectRunPairs } from '../../src/engine/detectors/run-length';
import { detectTables } from '../../src/engine/detectors/table-like';
import { validateResult } from '../../src/engine/evidence';

const cfg = { seed: 20261125, numRuns: 200 };
const bytes = fc.uint8Array({ minLength: 0, maxLength: 600 });
// Bytes shaped like a header, a literal body and a table block, so the "ok" path is exercised too.
const shaped = fc.tuple(fc.uint8Array({ minLength: 128, maxLength: 128 }), fc.uint8Array({ minLength: 1, maxLength: 200 }).map((a) => a.map((v) => v & 0x3f)), fc.uint8Array({ minLength: 769, maxLength: 769 }));
const join3 = ([a, b, c]: [Uint8Array, Uint8Array, Uint8Array]) => Uint8Array.of(...a, ...b, ...c);

describe('analyze properties', () => {
  it('never throws and returns clean output on random bytes', () => {
    fc.assert(fc.property(bytes, (b) => validateResult(analyze(b), b.length).length === 0), cfg);
  });
  it('never throws and returns clean output on shaped bytes, whole and truncated', () => {
    fc.assert(
      fc.property(shaped, fc.nat(1200), (parts, cut) => {
        const all = join3(parts);
        const b = all.slice(0, Math.min(cut, all.length));
        return validateResult(analyze(b), b.length).length === 0 && validateResult(analyze(all), all.length).length === 0;
      }),
      cfg,
    );
  });
  it('gives deep-equal output for identical input', () => {
    fc.assert(fc.property(shaped, (parts) => { const b = join3(parts); expect(analyze(b.slice())).toEqual(analyze(b)); }), cfg);
  });
  it('generic detectors never throw and stay in bounds, on random and truncated bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: 0, maxLength: 1500 }), fc.nat(1500), (b, cut) => {
        const x = b.slice(0, Math.min(cut, b.length));
        const ranges = [
          ...detectRepetition(x, defaultConfig).map((c) => c.range),
          ...detectPalette(x, defaultConfig).map((c) => c.range),
          ...detectTables(x, defaultConfig).map((c) => c.range),
        ];
        detectRunPairs(x, defaultConfig);
        expect(detectPalette(x, defaultConfig)).toEqual(detectPalette(x.slice(), defaultConfig));
        return ranges.every((r) => r.start >= 0 && r.start < r.end && r.end <= x.length);
      }),
      cfg,
    );
  });
  it('handles the empty array', () => {
    expect(analyze(new Uint8Array(0)).status).toBe('unrecovered');
  });
});

describe('engine source guard (guardrail 2)', () => {
  const allowed = new Set(['config.ts', 'trial-decode.ts']);
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  it('has no format names or magic-number constants outside config.ts and trial-decode.ts', () => {
    const bad: string[] = [];
    for (const f of walk('src/engine')) {
      if (allowed.has(f.split(/[\\/]/).pop()!)) continue;
      const text = readFileSync(f, 'utf8');
      if (/pcx|zsoft|0x0a\b|0x0c\b|0xc0\b/i.test(text)) bad.push(f);
      if (/Date\.now|new Date|Math\.random|\bfetch\(|node:fs/.test(text)) bad.push(`${f} (clock, randomness or I/O)`);
    }
    expect(bad).toEqual([]);
  });
});
