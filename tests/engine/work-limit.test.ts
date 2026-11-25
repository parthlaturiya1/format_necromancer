// Work limit (T-21b, security X7). Crafted files must end fast and with a plain reason, never throw.
// All inputs are built in memory from a fixed generator; nothing large is committed.
// Times are printed so the verification note can quote them.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';
import { analyze } from '../../src/engine/analyze';
import { defaultConfig } from '../../src/engine/config';
import { runPipeline } from '../../src/engine/pipeline';
import { detectBoxNumbers } from '../../src/engine/detectors/box-numbers';
import { detectPalette } from '../../src/engine/detectors/palette';
import { detectRepetition } from '../../src/engine/detectors/repetition';
import { detectRunPairs } from '../../src/engine/detectors/run-length';
import { detectTables } from '../../src/engine/detectors/table-like';
import { trialDecode } from '../../src/engine/trial-decode';
import { createWorkMeter, WORK_LIMIT_REASON } from '../../src/engine/work';

const MAX_MS = 3000;
const TEN_MB = defaultConfig.maxInputBytes;

/** Fixed-seed byte generator (xorshift32). Deterministic. */
function noise(n: number, seed: number): Uint8Array {
  const out = new Uint8Array(n);
  let s = seed >>> 0 || 1;
  for (let i = 0; i < n; i++) {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    out[i] = s & 0xff;
  }
  return out;
}

const filled = (n: number, f: (i: number) => number) => {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = f(i) & 0xff;
  return out;
};

const cases: Record<string, () => Uint8Array> = {
  // No marker bytes anywhere: every header x tail x mask guess decodes the whole 10 MB.
  'all literal bytes, every header guess decodes': () => new Uint8Array(TEN_MB).fill(0x01),
  // Marker then count 1..: each pair gives a count byte that chains to a huge output.
  'run pairs that expand to hundreds of millions of values': () => filled(TEN_MB, (i) => (i % 2 === 0 ? 0xff : 0x3f)),
  // Header-like numbers at every offset, so many box guesses meet many header guesses.
  'many candidate size numbers': () => filled(TEN_MB, (i) => (i % 8 === 4 || i % 8 === 6 ? 9 : 0)),
  // Smooth ramp: palette windows pass at many offsets.
  'smooth ramp keeps palette busy': () => filled(TEN_MB, (i) => ((i * 7) >> 4) & 0x7f),
  // Period repeats with changes: repetition and table detectors stay busy.
  'near-repeating records keep table and repetition busy': () => {
    const b = noise(TEN_MB, 7).map((x) => x & 0x7f); // no marker bytes, so it decodes under every guess
    for (let i = 16; i < b.length; i++) if ((i & 3) !== 0) b[i] = b[i - 16]!;
    return b;
  },
  // Long ambiguous tail: a short valid-looking start, then 10 MB that decodes only under some guesses.
  'long ambiguous tail': () => {
    const b = filled(TEN_MB, (i) => (i % 3 === 0 ? 0xc1 : 0x05));
    return b;
  },
  'random 10 MB': () => noise(TEN_MB, 99),
  'random 10 MB without marker bytes': () => noise(TEN_MB, 5).map((x) => x & 0x7f),
  'all zero 10 MB': () => new Uint8Array(TEN_MB),
};

describe('work limit: adversarial inputs', () => {
  for (const [name, make] of Object.entries(cases)) {
    it(`${name}: under ${MAX_MS} ms, ok or unrecovered with a reason`, () => {
      const bytes = make();
      const t = performance.now();
      const r = runPipeline(bytes);
      const ms = performance.now() - t;
      console.log(`work-limit time | ${name} | ${Math.round(ms)} ms | ${r.recovered.status}${r.recovered.status === 'unrecovered' ? ` | ${r.recovered.reason}` : ''}`);
      expect(ms).toBeLessThan(MAX_MS);
      if (r.recovered.status === 'unrecovered') expect(r.recovered.reason.trim().length).toBeGreaterThan(0);
      if (r.analysis.status === 'unrecovered') expect(r.analysis.reason.trim().length).toBeGreaterThan(0);
    });
  }

  it('the generic detectors on busy 10 MB patterns are all charged to the meter (about 30 steps per byte; the time is printed, not asserted)', () => {
    const patterns = [cases['smooth ramp keeps palette busy']!(), cases['near-repeating records keep table and repetition busy']!()];
    for (const bytes of patterns) {
      const meter = createWorkMeter(Number.MAX_SAFE_INTEGER);
      const t = performance.now();
      detectBoxNumbers(bytes, defaultConfig, meter);
      detectRepetition(bytes, defaultConfig, meter);
      detectRunPairs(bytes, defaultConfig, meter);
      detectPalette(bytes, defaultConfig, meter);
      detectTables(bytes, defaultConfig, meter);
      const ms = performance.now() - t;
      console.log(`work-limit detectors | 10 MB | ${Math.round(ms)} ms | ${meter.used} steps`);
      expect(meter.used).toBeGreaterThan(bytes.length * 25);
    }
  }, 30000);

  it('every tuning sample finishes far under the budget (steps are printed)', () => {
    let worst = 0;
    for (const s of listTuningSamples() as { id: string; path: string }[]) {
      const meter = createWorkMeter(defaultConfig.workBudget);
      const a = analyze(new Uint8Array(readFileSync(s.path)), defaultConfig, meter);
      expect(a.status).toBe('ok');
      worst = Math.max(worst, meter.used);
    }
    console.log(`work-limit samples | largest analysis use ${worst} of ${defaultConfig.workBudget} steps`);
    expect(worst).toBeLessThan(defaultConfig.workBudget / 10);
  });

  it('a tiny budget stops the analysis with the plain reason and does not throw', () => {
    const bytes = new Uint8Array(100_000).fill(0x01);
    const a = analyze(bytes, { ...defaultConfig, workBudget: 1000 });
    expect(a.status).toBe('unrecovered');
    if (a.status === 'unrecovered') expect(a.reason).toContain(WORK_LIMIT_REASON);
    const p = runPipeline(bytes, { ...defaultConfig, workBudget: 1000 });
    expect(p.recovered.status).toBe('unrecovered');
  });

  it('the budget is shared: the same limit is hit in the recoverer after the analyzer spent most of it', () => {
    const m = createWorkMeter(10);
    m.spend(10);
    expect(() => m.spend(1)).toThrow();
    expect(m.used).toBe(11);
  });

  it('a run-length body cannot expand past the output cap (trial decode stops early)', () => {
    const bytes = filled(1_000_000, (i) => (i % 2 === 0 ? 0xff : 0x3f));
    const r = trialDecode(bytes, 0, bytes.length, 0xc0, defaultConfig.maxOutputValues);
    expect(r.ok).toBe(false);
    expect(r.outputLength).toBeLessThanOrEqual(defaultConfig.maxOutputValues + 63);
    expect(r.steps).toBeLessThan(bytes.length / 2);
  });
});
