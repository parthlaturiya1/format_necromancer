import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runPipeline } from '../engine/pipeline';
import { describeShort } from './describe';
import { statesFor } from './hex/intervals';
import { announce, buildRegions, indexFromRegions, rangeText, regionAt } from './regions';

const bytes = new Uint8Array(readFileSync('public/samples/tiny-rand-7x5.pcx'));
const result = runPipeline(bytes);
const regions = buildRegions(result);

describe('regions from a real run', () => {
  it('has the analysis regions and one region per recovered row', () => {
    expect(result.recovered.status).toBe('ok');
    const rows = regions.filter((r) => r.kind === 'row');
    expect(rows.length).toBe(result.recovered.status === 'ok' ? result.recovered.height : -1);
    expect(regions.some((r) => r.kind === 'analysis')).toBe(true);
  });
  it('colours the header bytes as explained (N1)', () => {
    const header = regions.find((r) => r.kind === 'analysis' && r.ranges[0]?.start === 0);
    expect(header).toBeDefined();
    const st = statesFor(indexFromRegions(regions), 0, header!.ranges[0]!.end);
    expect(st.every((s) => s === 2)).toBe(true);
  });
  it('colours the last byte of the file when a table-tail region exists', () => {
    const tail = regions.find((r) => r.id === 'table-tail');
    if (tail) expect(statesFor(indexFromRegions(regions), bytes.length - 1, bytes.length)[0]).not.toBe(0);
  });
  it('answers a byte with the tightest region, and an umbrella never wins', () => {
    for (const r of regions.filter((x) => x.kind === 'row')) {
      const q = r.ranges[0]!;
      expect(regionAt(regions, q.start)?.umbrella).toBe(false);
    }
    expect(regionAt(regions, 0)?.kind).toBe('analysis');
  });
  it('returns null for a byte nothing explains', () => {
    expect(regionAt([], 5)).toBeNull();
  });
  it('formats ranges and the announcement', () => {
    expect(rangeText({ start: 0x1a4, end: 0x1db })).toBe('0x01A4 to 0x01DA');
    const row = regions.find((r) => r.kind === 'row')!;
    expect(announce(row)).toMatch(/^Row \d+, run rule, confidence \d\.\d\d, bytes 0x[0-9A-F]{4} to 0x[0-9A-F]{4}$/);
  });
  it('gives an empty list when nothing was recovered', () => {
    expect(buildRegions(runPipeline(new Uint8Array(40)))).toEqual([]);
  });
});

describe('describeShort', () => {
  it('uses only reported facts', () => {
    expect(describeShort({ headerLength: 128, boxNumbers: [111, 111], runMarkerMask: 192 })).toBe('128-byte header, 111 by 111 picture, repeat runs.');
  });
});
