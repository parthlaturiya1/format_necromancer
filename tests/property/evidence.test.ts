import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createEvidence, sortEvidence, validateEvidence } from '../../src/engine/evidence';
import type { Evidence } from '../../src/engine/types';

const cfg = { seed: 20261125, numRuns: 200 };
const word = fc.string({ minLength: 1, maxLength: 12 }).filter((s) => s.trim() !== '');

const inBounds = fc.integer({ min: 1, max: 5000 }).chain((len) =>
  fc.record({
    len: fc.constant(len),
    elementId: word,
    rule: word,
    hypothesisId: word,
    confidence: fc.double({ min: 0, max: 1, noNaN: true }),
    byteRanges: fc.array(
      fc.tuple(fc.nat(len - 1), fc.nat(len - 1)).map(([a, b]) => ({ start: Math.min(a, b), end: Math.min(a, b) === Math.max(a, b) ? Math.min(a, b) + 1 : Math.max(a, b) })),
      { minLength: 1, maxLength: 6 },
    ),
  }),
);

const build = (x: { elementId: string; rule: string; hypothesisId: string; confidence: number; byteRanges: { start: number; end: number }[] }) => createEvidence(x);

describe('evidence properties', () => {
  it('R-E2 R-E3 R-E4 in-bounds input always validates', () => {
    fc.assert(fc.property(inBounds, (x) => validateEvidence(build(x), x.len).length === 0), cfg);
  });

  it('R-E2 out-of-bounds ranges are always flagged', () => {
    const bad = fc.oneof(
      fc.record({ d: fc.integer({ min: 1, max: 1000 }) }).map(({ d }) => ({ start: -d, end: 3 })),
      fc.integer({ min: 0, max: 50 }).map((s) => ({ start: s, end: s })),
      fc.integer({ min: 1, max: 50 }).map((s) => ({ start: s + 1, end: s })),
      fc.integer({ min: 1, max: 1000 }).map((d) => ({ start: 0, end: 100 + d })),
    );
    fc.assert(fc.property(inBounds, bad, (x, r) => validateEvidence(build({ ...x, byteRanges: [r] }), 100).length > 0), cfg);
  });

  it('R-E3 NaN, infinite, negative and >1 confidence is always flagged', () => {
    const bad = fc.oneof(
      fc.constantFrom(NaN, Infinity, -Infinity),
      fc.double({ min: 1.0000001, max: 1e9, noNaN: true }),
      fc.double({ min: -1e9, max: -1e-9, noNaN: true }),
    );
    fc.assert(fc.property(inBounds, bad, (x, confidence) => validateEvidence(build({ ...x, confidence }), x.len).length > 0), cfg);
  });

  it('R-E4 empty or blank rule is always flagged', () => {
    const blank = fc.constantFrom('', ' ', '   ', '\t', '\n ');
    fc.assert(fc.property(inBounds, blank, (x, rule) => validateEvidence(build({ ...x, rule }), x.len).length > 0), cfg);
  });

  it('R-E1 R-E4 empty element or hypothesis id is always flagged', () => {
    fc.assert(
      fc.property(inBounds, fc.boolean(), (x, which) => {
        const e: Evidence = which ? { ...build(x), elementId: '' } : { ...build(x), hypothesisId: '' };
        return validateEvidence(e, x.len).length > 0;
      }),
      cfg,
    );
  });

  it('R-E6 same inputs give deeply equal output', () => {
    fc.assert(fc.property(inBounds, (x) => { expect(build(x)).toEqual(build(x)); }), cfg);
  });

  it('R-E6 sortEvidence is deterministic, order-independent, idempotent and does not change input', () => {
    const list = fc.array(inBounds.map(build), { maxLength: 12 });
    fc.assert(
      fc.property(list, fc.integer(), (items, k) => {
        const before = JSON.stringify(items);
        const sorted = sortEvidence(items);
        expect(JSON.stringify(items)).toBe(before);
        expect(sortEvidence(items)).toEqual(sorted);
        expect(sortEvidence(sorted)).toEqual(sorted);
        const shift = items.length === 0 ? 0 : Math.abs(k) % items.length;
        const rotated = [...items.slice(shift), ...items.slice(0, shift)];
        expect(JSON.stringify(sortEvidence(rotated))).toBe(JSON.stringify(sorted));
        expect(sorted).toHaveLength(items.length);
      }),
      cfg,
    );
  });
});
