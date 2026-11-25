import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateResult } from '../../src/engine/evidence';
import { runPipeline, type PipelineResult } from '../../src/engine/pipeline';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

const cfg = { seed: 20261125, numRuns: 200 };

/** Everything a clean pipeline result must satisfy. Returns problems. */
function problems(r: PipelineResult, n: number): string[] {
  const p: string[] = [];
  const rec = r.recovered;
  if (rec.status === 'unrecovered') return rec.reason.trim() === '' ? ['empty reason'] : [];
  if (r.analysis.status !== 'ok') return ['recovered without an ok analysis'];
  if (rec.rows.length !== rec.height) p.push('row count differs from height');
  if (rec.rgb.length !== rec.width * rec.height * 3) p.push('rgb length wrong');
  const ids = rec.evidence.map((e) => e.elementId);
  if (new Set(ids).size !== ids.length || ids.length !== rec.rows.length) p.push('not exactly one evidence per row');
  rec.rows.forEach((row, i) => {
    if (row.index !== i || row.evidenceId !== ids[i]) p.push(`row ${i} is not linked to its evidence`);
  });
  p.push(...validateResult({ status: 'ok', hypotheses: r.analysis.hypotheses, evidence: rec.evidence }, n));
  return p;
}

// A file with the shape the analyzer can read: header, literal body (values below the run marker), table block.
const shaped = fc.tuple(fc.uint8Array({ minLength: 128, maxLength: 128 }), fc.uint8Array({ minLength: 1, maxLength: 200 }).map((a) => a.map((v) => v & 0x3f)), fc.uint8Array({ minLength: 769, maxLength: 769 }));

describe('pipeline properties', () => {
  it('never throws, returns clean output, and is deterministic on random, empty and short bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: 0, maxLength: 600 }), (b) => {
        const a = runPipeline(b);
        return problems(a, b.length).length === 0 && JSON.stringify(a) === JSON.stringify(runPipeline(b.slice()));
      }),
      cfg,
    );
  });
  it('is clean on shaped bytes, whole and truncated', () => {
    fc.assert(
      fc.property(shaped, fc.nat(1200), ([h, body, t], cut) => {
        const all = Uint8Array.of(...h, ...body, ...t);
        const part = all.slice(0, Math.min(cut, all.length));
        return problems(runPipeline(all), all.length).length === 0 && problems(runPipeline(part), part.length).length === 0;
      }),
      cfg,
    );
  });
  it('is clean on truncated and byte-changed tuning samples', () => {
    const samples: { path: string }[] = listTuningSamples();
    fc.assert(
      fc.property(fc.nat(samples.length - 1), fc.nat(5000), fc.nat(5000), fc.nat(255), (si, cut, at, v) => {
        const whole = new Uint8Array(readFileSync(samples[si]!.path));
        const truncated = whole.slice(0, Math.max(0, whole.length - (cut % whole.length)));
        const changed = whole.slice();
        changed[at % changed.length] = v;
        return problems(runPipeline(truncated), truncated.length).length === 0 && problems(runPipeline(changed), changed.length).length === 0;
      }),
      cfg,
    );
  });
  it('handles an empty array and non-byte input without throwing', () => {
    expect(runPipeline(new Uint8Array(0)).recovered.status).toBe('unrecovered');
    expect(runPipeline(undefined as unknown as Uint8Array).recovered.status).toBe('unrecovered');
  });
  it('runs a 1 MB pseudo-random input in under 3 seconds', () => {
    const b = new Uint8Array(1024 * 1024);
    let s = 12345;
    for (let i = 0; i < b.length; i++) {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      b[i] = s & 255;
    }
    const t = performance.now();
    const r = runPipeline(b);
    const ms = performance.now() - t;
    expect(r.recovered.status).toBe('unrecovered');
    expect(ms).toBeLessThan(3000);
  });
  it('runs a 1 MB literal-body input in under 3 seconds', () => {
    const b = new Uint8Array(1024 * 1024).map((_, i) => (i * 7) & 0x3f);
    const t = performance.now();
    expect(problems(runPipeline(b), b.length)).toEqual([]);
    expect(performance.now() - t).toBeLessThan(3000);
  });
});
