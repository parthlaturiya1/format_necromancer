// T-08 unit tests: the run-length decoder on hand-made bytes, and each recoverer self-check.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeRunLengthRows } from '../../src/engine/decoders/run-length-rows';
import { validateResult } from '../../src/engine/evidence';
import { recover } from '../../src/engine/recover';
import type { AnalysisResult, Layout } from '../../src/engine/types';

const MASK = 0xc0; // test-side choice, passed in as data
const run = (count: number, value: number) => [MASK | count, value];

describe('decodeRunLengthRows', () => {
  it('splits runs and literals into rows with body ranges', () => {
    // stride 4, height 2: row0 = 5 5 5 1 (run3, literal), row1 = 2 2 2 2 (run4)
    const b = Uint8Array.from([9, 9, ...run(3, 5), 1, ...run(4, 2)]);
    const r = decodeRunLengthRows(b, 2, b.length, MASK, 4, 2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([...r.rows[0]!.indexes]).toEqual([5, 5, 5, 1]);
    expect(r.rows[0]!.range).toEqual({ start: 2, end: 5 });
    expect(r.rows[1]!.range).toEqual({ start: 5, end: 7 });
    expect(r.rows.some((x) => x.runFromAbove || x.runIntoBelow)).toBe(false);
  });
  it('flags a run that crosses a row end', () => {
    const b = Uint8Array.from([...run(6, 7), ...run(2, 1)]);
    const r = decodeRunLengthRows(b, 0, b.length, MASK, 4, 2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows[0]!.runIntoBelow).toBe(true);
    expect(r.rows[1]!.runFromAbove).toBe(true);
    expect(r.rows[1]!.range).toEqual({ start: 0, end: 4 });
  });
  it('fails on too few values, too many values, a cut-off run and a zero count', () => {
    expect(decodeRunLengthRows(Uint8Array.from([1, 2, 3]), 0, 3, MASK, 4, 1).ok).toBe(false);
    expect(decodeRunLengthRows(Uint8Array.from([...run(5, 1)]), 0, 2, MASK, 4, 1).ok).toBe(false);
    expect(decodeRunLengthRows(Uint8Array.from([1, MASK | 2]), 0, 2, MASK, 3, 1).ok).toBe(false);
    expect(decodeRunLengthRows(Uint8Array.from([MASK, 1]), 0, 2, MASK, 1, 1).ok).toBe(false);
    expect(decodeRunLengthRows(new Uint8Array(4), 0, 4, MASK, 0, 1).ok).toBe(false);
  });
});

// A 4x2 image, stride 4, header 3 bytes, table block at the end: one lead byte, then 768 bytes of entries.
// T-10: the lead byte was added because a table with nothing marking its start now lowers confidence (R-X3).
function build(rowsBytes: number[], table: Uint8Array | null): { bytes: Uint8Array; analysis: AnalysisResult; layout: Layout } {
  const body = [0, 0, 0, ...rowsBytes];
  const tail = table ? Array.from(table) : [];
  const bytes = Uint8Array.from([...body, ...tail]);
  const layout: Layout = { headerLength: 3, boxNumbers: [4, 2], rowStride: 4, runMarkerMask: MASK };
  if (table) {
    layout.tableTailLength = table.length;
    layout.tableTailOffset = body.length;
  }
  const analysis: AnalysisResult = { status: 'ok', hypotheses: [{ id: 'h1', rank: 1, confidence: 1, ranges: [{ start: 0, end: bytes.length }], layout }], evidence: [] };
  return { bytes, analysis, layout };
}
const ramp = () => Uint8Array.of(0, ...Uint8Array.from({ length: 768 }, (_, i) => (i % 3 === 0 ? Math.floor(i / 3) : i % 3 === 1 ? 255 - Math.floor(i / 3) : 7)));

describe('recover', () => {
  it('colours rows from the table and gives one evidence per row', () => {
    const { bytes, analysis } = build([...run(4, 1), 2, 3, 4, 5], ramp());
    const r = recover(bytes, analysis);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect([r.width, r.height]).toEqual([4, 2]);
    expect([...r.rgb.slice(0, 3)]).toEqual([1, 254, 7]);
    expect([...r.rgb.slice(12, 15)]).toEqual([2, 253, 7]);
    expect(r.rows.map((x) => x.status)).toEqual(['ok', 'ok']);
    expect(r.evidence.length).toBe(2);
    expect(r.evidence[0]!.byteRanges[1]).toEqual({ start: bytes.length - 768, end: bytes.length });
    expect(validateResult({ status: 'ok', hypotheses: [{ id: 'h1', rank: 1, confidence: 1, ranges: [], layout: {} }], evidence: r.evidence }, bytes.length)).toEqual([]);
  });
  it('lowers confidence for a run that crosses a row end (check: runs vs row ends)', () => {
    const { bytes, analysis } = build([...run(6, 1), ...run(2, 2)], ramp());
    const r = recover(bytes, analysis);
    if (r.status !== 'ok') throw new Error(r.reason);
    expect(r.rows[0]!.status).toBe('uncertain'); // T-10: one crossing now costs 0.15, so the row drops below 0.9
    expect(r.evidence[0]!.confidence).toBe(0.85);
    expect(r.evidence[0]!.rule).toContain('a run crosses');
  });
  it('shows grey and a lower confidence when there is no table (check: colour table present)', () => {
    const { bytes, analysis } = build([...run(4, 9), ...run(4, 9)], null);
    const r = recover(bytes, analysis);
    if (r.status !== 'ok') throw new Error(r.reason);
    expect([...r.rgb.slice(0, 3)]).toEqual([9, 9, 9]);
    expect(r.rows[0]!.status).toBe('uncertain');
    expect(r.evidence[0]!.byteRanges.length).toBe(1);
  });
  it('marks a row unexplained when an index points past a short table (check: index inside table)', () => {
    const { bytes, analysis } = build([...run(4, 200), ...run(4, 1)], ramp().slice(0, 31));
    const r = recover(bytes, analysis);
    if (r.status !== 'ok') throw new Error(r.reason);
    expect(r.rows.map((x) => x.status)).toEqual(['unexplained', 'ok']);
    expect(r.confidence).toBeLessThan(0.5);
  });
  it('returns unrecovered with a reason for each whole-image failure (check: exact body, stride, box, table position)', () => {
    const good = build([...run(4, 1), ...run(4, 2)], ramp());
    const withLayout = (patch: Partial<Layout>, bytes = good.bytes): Recovered => {
      const h = good.analysis.status === 'ok' ? good.analysis.hypotheses[0]! : (undefined as never);
      return recover(bytes, { status: 'ok', hypotheses: [{ ...h, layout: { ...good.layout, ...patch } }], evidence: [] });
    };
    type Recovered = ReturnType<typeof recover>;
    const cases: Recovered[] = [
      withLayout({ boxNumbers: undefined }),
      withLayout({ rowStride: undefined }),
      withLayout({ rowStride: 9 }),
      withLayout({ boxNumbers: [0, 2] }),
      withLayout({ boxNumbers: [4, 3] }), // body gives 8 values, 3 rows of 4 need 12
      withLayout({ runMarkerMask: undefined }),
      withLayout({ tableTailOffset: 5 }),
      withLayout({ headerLength: 9999 }),
      recover(good.bytes, { status: 'unrecovered', reason: 'x' }),
      recover(good.bytes, { status: 'ok', hypotheses: [], evidence: [] }),
    ];
    for (const c of cases) {
      expect(c.status).toBe('unrecovered');
      if (c.status === 'unrecovered') expect(c.reason.trim()).not.toBe('');
    }
  });
});

describe('engine source guard for T-08 files', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  it('has no format name, no reference or corpus access, and the decoder carries its disclosed header', () => {
    const files = walk('src/engine').filter((f) => /(recover|pipeline|png|run-length-rows)\.ts$/.test(f));
    expect(files.length).toBe(4);
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/pcx|zsoft|corpus|reference\/|heldout|node:fs/i);
    }
    expect(readFileSync('src/engine/decoders/run-length-rows.ts', 'utf8')).toContain('FORMAT-AWARE (disclosed)');
  });
});
