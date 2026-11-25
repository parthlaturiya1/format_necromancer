import type { VerificationReport } from '../../engine/verify';
import { indexFromRegions, type Region } from '../regions';

/** Confidence of each recovered row, in row order. Rows with no evidence read 0. */
export function rowConfidences(regions: ReadonlyArray<Region>, height: number): number[] {
  const out = new Array<number>(height).fill(0);
  for (const r of regions) if (r.kind === 'row' && r.rows[0] !== undefined && r.rows[0] < height) out[r.rows[0]] = r.confidence;
  return out;
}

export const mean = (xs: ReadonlyArray<number>) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Real byte counts: explained and uncertain come from the evidence index; every other byte is unexplained. They sum to `total`. */
export function coverage(regions: ReadonlyArray<Region>, total: number): { explained: number; uncertain: number; unexplained: number } {
  let explained = 0;
  let uncertain = 0;
  for (const s of indexFromRegions(regions)) {
    const n = Math.max(0, Math.min(s.end, total) - Math.min(s.start, total));
    if (s.state === 2) explained += n;
    else if (s.state === 1) uncertain += n;
  }
  return { explained, uncertain, unexplained: total - explained - uncertain };
}

/** Mismatches per picture row, from the listed mismatches. The list is cut at 1000, so the sum can be lower than the true count. */
export function mismatchesByRow(report: VerificationReport | null, height: number): number[] {
  const out = new Array<number>(height).fill(0);
  if (report && report.mode === 'reference') for (const m of report.mismatches) if (m.row < height) out[m.row]! += 1;
  return out;
}

export const rgbText = (c: ReadonlyArray<number>) => `rgb(${c.join(', ')})`;
