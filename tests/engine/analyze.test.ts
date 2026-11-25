import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { defaultConfig } from '../../src/engine/config';
import { detectBoxNumbers } from '../../src/engine/detectors/box-numbers';
import { detectHeaderBlocks } from '../../src/engine/detectors/header-block';
import { detectRowStride } from '../../src/engine/detectors/row-stride';
import { validateResult } from '../../src/engine/evidence';
import { trialDecode } from '../../src/engine/trial-decode';

const cfg = { ...defaultConfig, headerSizes: [16], tailSizes: [0], runMarkerMasks: [0xc0] };
// 16-byte header: four 16-bit numbers at byte 4 (0, 0, 3, 1 = a 4 by 2 box), row length 4 at byte 12; then 8 literal bytes.
const sample = (): Uint8Array => {
  const b = new Uint8Array(24);
  b.set([0, 0, 0, 0, 3, 0, 1, 0], 4);
  b[12] = 4;
  for (let i = 0; i < 8; i++) b[16 + i] = i + 1;
  return b;
};

describe('trialDecode', () => {
  it('counts literals and runs', () => {
    expect(trialDecode(Uint8Array.of(1, 0xc3, 7, 2), 0, 4, 0xc0)).toEqual({ ok: true, outputLength: 5, steps: 3 });
  });
  it('rejects a run cut off at the end and a zero count', () => {
    expect(trialDecode(Uint8Array.of(1, 0xc3), 0, 2, 0xc0).ok).toBe(false);
    expect(trialDecode(Uint8Array.of(0xc0, 5), 0, 2, 0xc0).ok).toBe(false);
  });
});

describe('detectors', () => {
  it('header-block finds the header size where the body decodes exactly', () => {
    expect(detectHeaderBlocks(sample(), cfg)).toEqual([{ headerLength: 16, tailLength: 0, runMarkerMask: 0xc0, bodyOutputLength: 8 }]);
  });
  it('header-block returns nothing when no guess decodes exactly', () => {
    expect(detectHeaderBlocks(new Uint8Array(25).fill(0xc1), cfg)).toEqual([]) // 9 marker bytes: the last run is cut off;
  });
  it('box-numbers reads four 16-bit numbers as a box', () => {
    expect(detectBoxNumbers(sample(), cfg)).toContainEqual({ offset: 4, width: 4, height: 2 });
  });
  it('row-stride accepts a fitting row length and reports where it is stored', () => {
    const header = detectHeaderBlocks(sample(), cfg)[0]!;
    expect(detectRowStride(sample(), cfg, header, { offset: 4, width: 4, height: 2 })).toEqual({ rowStride: 4, numberOffset: 12 });
  });
  it('row-stride rejects a box that does not split the decoded length', () => {
    const header = detectHeaderBlocks(sample(), cfg)[0]!;
    expect(detectRowStride(sample(), cfg, header, { offset: 4, width: 3, height: 3 })).toBeNull();
  });
});

describe('analyze', () => {
  it('ranks the true layout first with valid evidence', () => {
    const r = analyze(sample(), cfg);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.hypotheses[0]!.layout).toMatchObject({ headerLength: 16, boxNumbers: [4, 2], rowStride: 4 });
    expect(validateResult(r, 24)).toEqual([]);
  });
  it.each([
    ['empty', new Uint8Array(0)],
    ['too short', new Uint8Array(15)],
    ['too long', new Uint8Array(10 * 1024 * 1024 + 1)],
  ])('refuses %s input with a reason', (_n, bytes) => {
    const r = analyze(bytes);
    expect(r.status).toBe('unrecovered');
    if (r.status === 'unrecovered') expect(r.reason.length).toBeGreaterThan(5);
  });
  it('turns a thrown error into unrecovered', () => {
    const r = analyze(new Uint8Array(32), { ...defaultConfig, headerSizes: null as unknown as number[] });
    expect(r.status).toBe('unrecovered');
  });
  it('records a reason for every loser', () => {
    const r = analyze(sample(), { ...defaultConfig, tailSizes: [0] });
    if (r.status !== 'ok') throw new Error('expected ok');
    for (const h of r.hypotheses.slice(1)) expect(h.lostBecause).toBeTruthy();
    expect(r.hypotheses[0]!.lostBecause).toBeUndefined();
  });
  it('analyzes a 1 MB buffer in under 3 seconds', () => {
    const big = new Uint8Array(1024 * 1024);
    for (let i = 0; i < big.length; i++) big[i] = (i * 31 + (i >> 8)) & 0x3f; // literals only: every guess decodes the whole buffer
    const t = performance.now();
    const r = analyze(big);
    expect(performance.now() - t).toBeLessThan(3000);
    expect(validateResult(r, big.length)).toEqual([]);
  });
});

