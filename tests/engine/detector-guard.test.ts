// Detector guard (T-11b). The golden tests check rank 1 only, and the generic detectors never change rank,
// so a broken detector threshold stayed green (regression-report.md section 2). This test pins, per tuning
// sample and per generic detector, how many evidence records fired and how many byte ranges they hold,
// plus the total evidence count. The baseline is tests/engine/detector-baseline.json, generated from the
// current analyzer. To regenerate after an intended detector change: set UPDATE_DETECTOR_BASELINE=1 and
// review the diff. Reads tuning samples only through list-tuning-samples.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';
type Counts = { records: number; ranges: number };
type SampleBase = { evidenceTotal: number; detectors: Record<string, Counts> };
type Sample = { id: string; path: string };
const BASELINE = 'tests/engine/detector-baseline.json';
const generic = ['repeat-runs', 'repeat-structures', 'run-pairs', 'palette', 'table-records'];
function measure(): Record<string, SampleBase> {
  const samples: Sample[] = listTuningSamples();
  const out: Record<string, SampleBase> = {};
  for (const s of samples) {
    const r = analyze(new Uint8Array(readFileSync(s.path)));
    if (r.status !== 'ok') throw new Error(`${s.id}: unrecovered`);
    const detectors: Record<string, Counts> = {};
    for (const g of generic) {
      const hits = r.evidence.filter((e) => e.elementId === g);
      detectors[g] = { records: hits.length, ranges: hits.reduce((n, e) => n + e.byteRanges.length, 0) };
    }
    out[s.id] = { evidenceTotal: r.evidence.length, detectors };
  }
  return out;
}
it('every generic detector fires on each tuning sample exactly as in the committed baseline', () => {
  const now = measure();
  if (process.env.UPDATE_DETECTOR_BASELINE === '1') {
    writeFileSync(BASELINE, JSON.stringify(now, null, 2) + '\n');
    return;
  }
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, SampleBase>;
  expect(Object.keys(now).sort()).toEqual(Object.keys(baseline).sort());
  const problems: string[] = [];
  for (const id of Object.keys(baseline)) {
    const b = baseline[id]!;
    const n = now[id]!;
    if (n.evidenceTotal !== b.evidenceTotal) problems.push(`${id}: evidence total ${n.evidenceTotal}, baseline ${b.evidenceTotal}`);
    for (const g of generic) {
      const bd = b.detectors[g]!;
      const nd = n.detectors[g]!;
      if (nd.records !== bd.records || nd.ranges !== bd.ranges) {
        problems.push(`${id}: ${g} records/ranges ${nd.records}/${nd.ranges}, baseline ${bd.records}/${bd.ranges}`);
      }
    }
  }
  expect(problems).toEqual([]);
});
it('the baseline is not trivial: each generic detector fires on at least one sample', () => {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, SampleBase>;
  for (const g of generic) {
    const total = Object.values(baseline).reduce((n, s) => n + s.detectors[g]!.records, 0);
    expect(total, `${g} never fires in the baseline`).toBeGreaterThan(0);
  }
});
