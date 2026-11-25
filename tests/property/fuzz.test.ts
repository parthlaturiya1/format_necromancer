// Fuzz (T-10, R-X1). Fixed seed, 500+ runs per property. The pipeline must never throw and must return
// ok, or unrecovered with a non-empty plain-words reason. No single case may take more than 3 seconds.
// Counts are written to docs/verification/robustness-fuzz.json for the robustness report.
// Tuning samples only, through list-tuning-samples.mjs.
import fc from 'fast-check';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { runPipeline } from '../../src/engine/pipeline';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

const RUNS = 600;
const cfg = { seed: 20261125, numRuns: RUNS };
const MAX_MS = 3000;

const samples: { id: string; path: string }[] = listTuningSamples();
const files = samples.map((s) => new Uint8Array(readFileSync(s.path)));
const counts: Record<string, number> = {};
let cases = 0;
let crashes = 0;
let slowest = 0;
let slowestWhat = '';

/** Run one fuzz case. Returns a problem string, or '' when clean. */
function check(group: string, bytes: Uint8Array): string {
  counts[group] = (counts[group] ?? 0) + 1;
  cases++;
  const t = performance.now();
  try {
    const r = runPipeline(bytes);
    const ms = performance.now() - t;
    if (ms > slowest) {
      slowest = ms;
      slowestWhat = `${group}, ${bytes.length} bytes`;
    }
    if (ms > MAX_MS) return `took ${Math.round(ms)} ms`;
    if (r.recovered.status === 'unrecovered' && r.recovered.reason.trim().length === 0) return 'empty reason';
    if (r.analysis.status === 'unrecovered' && r.analysis.reason.trim().length === 0) return 'empty analysis reason';
    if (r.recovered.status !== 'ok' && r.recovered.status !== 'unrecovered') return 'unknown status';
    return '';
  } catch (e) {
    crashes++;
    return `threw: ${String(e)}`;
  }
}

const prop = (group: string, arb: fc.Arbitrary<Uint8Array>) =>
  fc.assert(
    fc.property(arb, (b) => {
      const p = check(group, b);
      if (p) throw new Error(`${group}: ${p}`);
    }),
    cfg,
  );

const pick = fc.nat(samples.length - 1);

describe('fuzz (R-X1)', () => {
  afterAll(() => {
    console.log(`fuzz: slowest case ${Math.round(slowest)} ms (${slowestWhat})`);
    mkdirSync('docs/verification', { recursive: true });
    writeFileSync('docs/verification/robustness-fuzz.json', JSON.stringify({ seed: cfg.seed, runsPerProperty: RUNS, cases, crashes, maxMsPerCase: MAX_MS, groups: counts }, null, 1) + '\n');
  });

  it('random bytes of random length', () => prop('random-bytes', fc.uint8Array({ minLength: 0, maxLength: 3000 })));
  it('1 to 15 bytes', () => prop('tiny-1-15', fc.uint8Array({ minLength: 1, maxLength: 15 })));
  it('truncation of every tuning sample at a random length', () =>
    prop('truncated-sample', fc.tuple(pick, fc.nat()).map(([i, n]) => files[i]!.slice(0, n % (files[i]!.length + 1)))));
  it('single byte flips inside a real sample', () =>
    prop('byte-flip', fc.tuple(pick, fc.nat(), fc.nat(255)).map(([i, at, v]) => { const b = files[i]!.slice(); b[at % b.length] = v; return b; })));
  it('random byte runs inside a real sample', () =>
    prop('byte-run', fc.tuple(pick, fc.nat(), fc.uint8Array({ minLength: 1, maxLength: 64 })).map(([i, at, run]) => { const b = files[i]!.slice(); const s = at % b.length; b.set(run.subarray(0, b.length - s), s); return b; })));
  it('empty input', () => {
    expect(check('empty', new Uint8Array(0))).toBe('');
  });
  it('10 MB + 1 buffer made in memory', () => {
    expect(check('oversized', new Uint8Array(10 * 1024 * 1024 + 1))).toBe('');
    const r = runPipeline(new Uint8Array(10 * 1024 * 1024 + 1));
    expect(r.recovered.status).toBe('unrecovered');
  });
  it('had at least 500 runs in every random group and no crash', () => {
    for (const g of ['random-bytes', 'tiny-1-15', 'truncated-sample', 'byte-flip', 'byte-run']) expect(counts[g]).toBeGreaterThanOrEqual(500);
    expect(crashes).toBe(0);
  });
});
