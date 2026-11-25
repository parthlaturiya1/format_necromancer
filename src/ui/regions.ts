import { defaultConfig } from '../engine/config';
import type { PipelineResult } from '../engine/pipeline';
import type { ByteRange, Evidence } from '../engine/types';
import { buildIndex, type ByteState, type Segment } from './hex/intervals';

export type RegionStatus = 'ok' | 'uncertain' | 'unexplained';

/** One selectable piece of evidence: a recovered row, or a region the analysis found (header, size numbers, table tail, ...). */
export type Region = {
  id: string;
  kind: 'row' | 'analysis';
  label: string;
  /** Recovered row numbers this region explains. Empty for analysis regions. */
  rows: number[];
  ranges: ByteRange[];
  rule: string;
  confidence: number;
  status: RegionStatus;
  /** An analysis range that wraps whole rows (the body). Selectable, but it never colours bytes or answers a byte click. */
  umbrella: boolean;
};

const statusOf = (conf: number): RegionStatus =>
  conf < defaultConfig.unexplainedBelow ? 'unexplained' : conf < defaultConfig.uncertainBelow ? 'uncertain' : 'ok';

const words = (id: string) => {
  const t = id.replace(/[-_]+/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Regions of a finished run: row evidence from recovery, plus the analysis evidence of the winning hypothesis. Empty when nothing was recovered. */
export function buildRegions(result: PipelineResult): Region[] {
  const rec = result.recovered;
  if (rec.status !== 'ok' || result.analysis.status !== 'ok') return [];
  const rowRanges = rec.evidence.map((e) => e.byteRanges[0]).filter((r): r is ByteRange => r !== undefined);
  const wraps = (e: Evidence) => e.byteRanges.some((r) => rowRanges.some((q) => r.start <= q.start && r.end >= q.end));
  const analysis: Region[] = result.analysis.evidence
    .filter((e) => e.hypothesisId === rec.hypothesisId)
    .map((e) => ({ id: e.elementId, kind: 'analysis', label: words(e.elementId), rows: [], ranges: [...e.byteRanges], rule: e.rule, confidence: e.confidence, status: statusOf(e.confidence), umbrella: wraps(e) }));
  const rowOf = new Map(rec.rows.map((r) => [r.evidenceId, r]));
  const rows: Region[] = [];
  for (const e of rec.evidence) {
    const row = rowOf.get(e.elementId);
    if (!row) continue;
    rows.push({ id: e.elementId, kind: 'row', label: `Row ${row.index}`, rows: [row.index], ranges: [...e.byteRanges], rule: e.rule, confidence: e.confidence, status: row.status, umbrella: false });
  }
  return [...analysis, ...rows];
}

/** Interval index for the hex panel. A row's status colours its ranges; analysis regions colour theirs by confidence. */
export function indexFromRegions(regions: ReadonlyArray<Region>): Segment[] {
  const code: Record<RegionStatus, ByteState> = { ok: 2, uncertain: 1, unexplained: 0 };
  return buildIndex(regions.filter((r) => !r.umbrella).flatMap((r) => r.ranges.map((range) => ({ range, state: code[r.status] }))));
}

/** The region a byte belongs to: the one with the tightest range around it, analysis before row on a tie. Null when no region explains it. */
export function regionAt(regions: ReadonlyArray<Region>, offset: number): Region | null {
  let best: Region | null = null;
  let size = Infinity;
  for (const r of regions) {
    if (r.umbrella) continue;
    for (const q of r.ranges) {
      if (offset < q.start || offset >= q.end) continue;
      const n = q.end - q.start;
      if (n < size || (n === size && best && best.kind === 'row' && r.kind === 'analysis')) {
        best = r;
        size = n;
      }
    }
  }
  return best;
}

export const hex = (n: number, pad = 4) => `0x${n.toString(16).toUpperCase().padStart(pad, '0')}`;

/** "0x01A4 to 0x01DA", last byte included. */
export const rangeText = (q: ByteRange) => `${hex(q.start)} to ${hex(q.end - 1)}`;

export const ruleName = (r: Region) => (r.kind === 'row' ? 'run rule' : 'layout evidence');

/** One line for the live region and the list labels. */
export function announce(r: Region): string {
  const q = r.ranges[0];
  return `${r.label}, ${ruleName(r)}, confidence ${r.confidence.toFixed(2)}${q ? `, bytes ${rangeText(q)}` : ''}`;
}
