// T-09: verifier unit tests (R-V1..R-V6), PNG encode round trip, evidence report.
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { runPipeline } from '../../src/engine/pipeline';
import { decodePng, encodePng, type Deflate } from '../../src/engine/png';
import type { Recovered } from '../../src/engine/recover';
import { buildEvidenceReport } from '../../src/engine/report';
import { MAX_MISMATCHES, verify } from '../../src/engine/verify';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';
import { nodeInflate } from './helpers/node-inflate';

const nodeDeflate: Deflate = async (d) => new Uint8Array(deflateSync(d));

const img = (width: number, height: number, fill = 7) => ({ width, height, rgb: new Uint8Array(width * height * 3).fill(fill) });
const rec = (i: { width: number; height: number; rgb: Uint8Array }): Recovered => ({ status: 'ok', ...i, rows: [], evidence: [], hypothesisId: 'h', confidence: 1 });

describe('verify', () => {
  it('exact match', () => {
    expect(verify(rec(img(4, 3)), img(4, 3))).toEqual({ mode: 'reference', exact: true, mismatchCount: 0, mismatches: [] });
  });
  it('one pixel off gives one correct entry', () => {
    const r = img(4, 3);
    r.rgb.set([1, 2, 3], (2 * 4 + 1) * 3);
    expect(verify(rec(r), img(4, 3))).toEqual({ mode: 'reference', exact: false, mismatchCount: 1, mismatches: [{ row: 2, col: 1, expected: [7, 7, 7], actual: [1, 2, 3] }] });
  });
  it('many pixels off: list capped at 1000, total kept', () => {
    const r = img(50, 40, 0);
    const rep = verify(rec(r), img(50, 40, 9));
    expect(rep.mode === 'reference' && rep.mismatchCount).toBe(2000);
    expect(rep.mode === 'reference' && rep.mismatches.length).toBe(MAX_MISMATCHES);
  });
  it('size differs: not exact, plain reason, no pixel compare', () => {
    for (const ref of [img(5, 3), img(4, 4)]) {
      const rep = verify(rec(img(4, 3)), ref);
      expect(rep).toMatchObject({ mode: 'reference', exact: false, mismatchCount: 0, mismatches: [] });
      expect(rep.mode === 'reference' && rep.reason).toContain('4 by 3');
    }
  });
  it('no reference never claims correctness', () => {
    expect(verify(rec(img(2, 2)), null)).toEqual({ mode: 'no-reference', note: 'no reference available' });
  });
  it('unrecovered input says so', () => {
    const rep = verify({ status: 'unrecovered', reason: 'bad bytes' }, img(2, 2));
    expect(rep).toMatchObject({ mode: 'reference', exact: false });
    expect(rep.mode === 'reference' && rep.reason).toContain('bad bytes');
  });
  it('is deterministic', () => {
    const r = img(9, 9, 1);
    expect(JSON.stringify(verify(rec(r), img(9, 9, 2)))).toBe(JSON.stringify(verify(rec(r), img(9, 9, 2))));
  });
});

describe('encodePng and report on the 11 tuning samples', () => {
  const samples = listTuningSamples() as Array<{ id: string; path: string; reference: { path: string } }>;
  for (const s of samples) {
    it(`${s.id}: round trip, verify exact, report JSON`, async () => {
      const bytes = new Uint8Array(readFileSync(s.path));
      const { analysis, recovered } = runPipeline(bytes);
      expect(recovered.status).toBe('ok');
      if (recovered.status !== 'ok') return;
      const png = await encodePng(recovered.width, recovered.height, recovered.rgb, nodeDeflate);
      const back = await decodePng(png, nodeInflate);
      expect(back.width).toBe(recovered.width);
      expect(Buffer.from(back.rgb).equals(Buffer.from(recovered.rgb))).toBe(true);
      const ref = await decodePng(new Uint8Array(readFileSync(s.reference.path)), nodeInflate);
      const v = verify(recovered, ref);
      expect(v).toMatchObject({ mode: 'reference', exact: true, mismatchCount: 0 });
      const rep = buildEvidenceReport(analysis, recovered, v);
      const json = JSON.stringify(rep);
      expect(JSON.stringify(buildEvidenceReport(analysis, recovered, v))).toBe(json);
      expect(JSON.parse(json)).toEqual(rep);
      expect(json.length).toBeLessThan(bytes.length * 40); // ranges, not raw bytes or pixels
    });
  }
});

describe('pipeline verify step', () => {
  it('runs only when a reference argument is passed', async () => {
    const s = (listTuningSamples() as Array<{ path: string; reference: { path: string } }>)[0]!;
    const bytes = new Uint8Array(readFileSync(s.path));
    expect(runPipeline(bytes).verification).toBeUndefined();
    expect(runPipeline(bytes, undefined, null).verification).toEqual({ mode: 'no-reference', note: 'no reference available' });
    const ref = await decodePng(new Uint8Array(readFileSync(s.reference.path)), nodeInflate);
    expect(runPipeline(bytes, undefined, ref).verification).toMatchObject({ mode: 'reference', exact: true });
  });
});
