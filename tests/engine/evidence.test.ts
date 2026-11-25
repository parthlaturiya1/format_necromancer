import { describe, expect, it } from 'vitest';
import { createEvidence, sortEvidence, validateEvidence, validateResult } from '../../src/engine/evidence';
import type { AnalysisResult, Evidence, Hypothesis } from '../../src/engine/types';

const ev = (o: Partial<Evidence> = {}): Evidence =>
  createEvidence({ elementId: 'e1', byteRanges: [{ start: 0, end: 4 }], rule: 'header ends where body uses every byte', confidence: 0.5, hypothesisId: 'h1', ...o });
const hyp = (o: Partial<Hypothesis> = {}): Hypothesis => ({ id: 'h1', rank: 1, confidence: 0.5, ranges: [{ start: 0, end: 4 }], layout: {}, ...o });
const ok = (evidence: Evidence[], hypotheses = [hyp()]): AnalysisResult => ({ status: 'ok', hypotheses, evidence });

describe('R-E1 one Evidence per element', () => {
  it('R-E1 accepts unique element ids', () => {
    expect(validateResult(ok([ev({ elementId: 'a' }), ev({ elementId: 'b' })]), 10)).toEqual([]);
  });
  it('R-E1 flags a second record for the same element', () => {
    expect(validateResult(ok([ev(), ev()]), 10).join()).toMatch(/more than one record/);
  });
  it('R-E1 flags an empty element id', () => {
    expect(validateEvidence(ev({ elementId: '' }), 10).join()).toMatch(/elementId is empty/);
  });
});

describe('R-E2 ranges in bounds', () => {
  it('R-E2 accepts 0..length', () => {
    expect(validateEvidence(ev({ byteRanges: [{ start: 0, end: 10 }] }), 10)).toEqual([]);
  });
  it.each([[-1, 3], [3, 3], [4, 3], [0, 11], [0.5, 2]])('R-E2 flags %d..%d', (start, end) => {
    expect(validateEvidence(ev({ byteRanges: [{ start, end }] }), 10)).not.toEqual([]);
  });
  it('R-E2 flags no ranges', () => {
    expect(validateEvidence(ev({ byteRanges: [] }), 10)).not.toEqual([]);
  });
});

describe('R-E3 confidence', () => {
  it.each([0, 1, 0.37])('R-E3 accepts %d', (confidence) => {
    expect(validateEvidence(ev({ confidence }), 10)).toEqual([]);
  });
  it.each([NaN, Infinity, -Infinity, -0.01, 1.01])('R-E3 flags %d', (confidence) => {
    expect(validateEvidence(ev({ confidence }), 10)).not.toEqual([]);
  });
});

describe('R-E4 rule and hypothesis link', () => {
  it('R-E4 flags empty and blank rule', () => {
    expect(validateEvidence(ev({ rule: '' }), 10)).not.toEqual([]);
    expect(validateEvidence(ev({ rule: '   ' }), 10)).not.toEqual([]);
  });
  it('R-E4 flags empty hypothesisId', () => {
    expect(validateEvidence(ev({ hypothesisId: '' }), 10)).not.toEqual([]);
  });
  it('R-E4 flags a hypothesisId not in the result', () => {
    expect(validateResult(ok([ev({ hypothesisId: 'zzz' })]), 10).join()).toMatch(/not in the result/);
  });
});

describe('R-E5 nothing silently omitted', () => {
  it('R-E5 low confidence evidence is valid', () => {
    expect(validateEvidence(ev({ confidence: 0 }), 10)).toEqual([]);
  });
  it('R-E5 a result with an unexplained region as confidence 0 evidence is valid', () => {
    expect(validateResult(ok([ev({ confidence: 0, rule: 'unexplained region' })]), 10)).toEqual([]);
  });
});

describe('R-E6 deterministic order', () => {
  it('R-E6 sorts by element id and does not change the input', () => {
    const input = [ev({ elementId: 'b' }), ev({ elementId: 'a' })];
    expect(sortEvidence(input).map((e) => e.elementId)).toEqual(['a', 'b']);
    expect(input.map((e) => e.elementId)).toEqual(['b', 'a']);
  });
  it('R-E6 breaks ties on hypothesis, rule, confidence, then ranges', () => {
    const a = ev({ confidence: 0.1 });
    const b = ev({ confidence: 0.2 });
    const c = ev({ confidence: 0.2, byteRanges: [{ start: 1, end: 2 }] });
    expect(sortEvidence([c, b, a])).toEqual([a, b, c]);
  });
});

describe('R-A3 hypothesis fields', () => {
  it('R-A3 accepts a complete hypothesis', () => {
    expect(validateResult(ok([]), 10)).toEqual([]);
  });
  it('R-A3 flags empty id, bad rank, bad confidence, bad range', () => {
    expect(validateResult(ok([], [hyp({ id: '' })]), 10)).not.toEqual([]);
    expect(validateResult(ok([], [hyp({ rank: 0 })]), 10)).not.toEqual([]);
    expect(validateResult(ok([], [hyp({ confidence: 2 })]), 10)).not.toEqual([]);
    expect(validateResult(ok([], [hyp({ ranges: [{ start: 5, end: 99 }] })]), 10)).not.toEqual([]);
  });
  it('R-A3 flags duplicate hypothesis ids', () => {
    expect(validateResult(ok([], [hyp(), hyp()]), 10).join()).toMatch(/duplicate/);
  });
  it('R-A3 unrecovered needs a non-empty reason', () => {
    expect(validateResult({ status: 'unrecovered', reason: '' }, 10)).not.toEqual([]);
    expect(validateResult({ status: 'unrecovered', reason: 'input shorter than 16 bytes' }, 10)).toEqual([]);
  });
});
