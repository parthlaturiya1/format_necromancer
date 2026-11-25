import { describe, expect, it } from 'vitest';
import type { Region } from '../regions';
import { coverage, mean, mismatchesByRow, rowConfidences } from './stats';

const row = (i: number, start: number, end: number, confidence: number, status: Region['status']): Region => ({
  id: `r${i}`, kind: 'row', label: `Row ${i}`, rows: [i], ranges: [{ start, end }], rule: 'x', confidence, status, umbrella: false,
});

describe('hud stats', () => {
  const regions = [row(0, 0, 10, 1, 'ok'), row(1, 10, 14, 0.6, 'uncertain'), row(2, 20, 22, 0.1, 'unexplained')];
  it('row confidences by index, mean', () => {
    expect(rowConfidences(regions, 4)).toEqual([1, 0.6, 0.1, 0]);
    expect(mean([1, 0.5])).toBe(0.75);
    expect(mean([])).toBe(0);
  });
  it('coverage counts bytes and sums to the file size', () => {
    expect(coverage(regions, 30)).toEqual({ explained: 10, uncertain: 4, unexplained: 16 });
  });
  it('mismatches by row; none without a reference', () => {
    const rep = { mode: 'reference' as const, exact: false, mismatchCount: 3, mismatches: [1, 1, 3].map((r) => ({ row: r, col: 0, expected: [0, 0, 0] as [number, number, number], actual: [1, 1, 1] as [number, number, number] })) };
    expect(mismatchesByRow(rep, 4)).toEqual([0, 2, 0, 1]);
    expect(mismatchesByRow({ mode: 'no-reference', note: 'no reference available' }, 2)).toEqual([0, 0]);
  });
});
