// Budget (b-2): analyze + recover of a generated 1 MB buffer and of every tuning sample, each under 3 s in Node (D-10).
// Run by verify step 8 with scripts/budgets/vitest.config.mts. Writes test-results/budgets-engine.json for the report.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { defaultConfig } from '../../src/engine/config';
import { recover } from '../../src/engine/recover';
import { listTuningSamples } from '../corpus/list-tuning-samples.mjs';

const LIMIT_MS = 3000; // D-10. Never loosen.
const time = (bytes: Uint8Array) => {
  const t = performance.now();
  const a = analyze(bytes, defaultConfig);
  recover(bytes, a, defaultConfig);
  return Math.round((performance.now() - t) * 10) / 10;
};

it('analyze + recover stay under 3 s', () => {
  const rows: { name: string; bytes: number; ms: number }[] = [];
  // Deterministic xorshift noise, 1 MiB: the worst case for detectors (no structure to stop early).
  const big = new Uint8Array(1024 * 1024);
  let x = 0x9e3779b9;
  for (let i = 0; i < big.length; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; big[i] = x & 255; }
  rows.push({ name: 'generated 1 MiB noise', bytes: big.length, ms: time(big) });
  // Noise may stop early, so also time a real sample followed by noise up to 1 MiB (a layout is found, then a long tail follows).
  const first = listTuningSamples()[0];
  const padded = new Uint8Array(big);
  padded.set(new Uint8Array(readFileSync(first.path)));
  rows.push({ name: `${first.id} + noise to 1 MiB`, bytes: padded.length, ms: time(padded) });
  for (const s of listTuningSamples()) {
    const b = new Uint8Array(readFileSync(s.path));
    rows.push({ name: s.id, bytes: b.length, ms: time(b) });
  }
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/budgets-engine.json', JSON.stringify({ limitMs: LIMIT_MS, rows }, null, 2));
  for (const r of rows) expect(r.ms, `${r.name} took ${r.ms} ms`).toBeLessThan(LIMIT_MS);
}, 60_000);
