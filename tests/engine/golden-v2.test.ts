// Golden corpus report v2 (T-07). Reads tuning samples ONLY through list-tuning-samples.mjs.
// Writes docs/verification/golden-report-v2.md, then fails if any rank-1 layout differs from the T-06
// baseline (scripts/golden/baseline.json, generated from the T-06 report, never edited) or its confidence drops.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

type Base = { boxNumbers: number[]; rowStride: number | null; headerLength: number; runMarkerMask: number; tableTailLength: number; tableTailOffset: number | null; confidence: number; evidenceCount: number };
type Sample = { id: string; path: string };
const generic = ['repeat-runs', 'repeat-structures', 'run-pairs', 'palette', 'table-records'];

it('rank 1 is no worse than T-06 on every tuning sample; writes the v2 report', () => {
  const baseline = JSON.parse(readFileSync('scripts/golden/baseline.json', 'utf8')).samples as Record<string, Base>;
  const samples: Sample[] = listTuningSamples();
  expect(samples.length).toBe(11);
  const rows: string[] = [];
  const problems: string[] = [];
  let same = 0;
  for (const s of samples) {
    const b = baseline[s.id];
    if (!b) {
      problems.push(`${s.id}: no baseline entry`);
      continue;
    }
    const bytes = new Uint8Array(readFileSync(s.path));
    const r = analyze(bytes);
    if (r.status !== 'ok') {
      problems.push(`${s.id}: unrecovered`);
      continue;
    }
    const top = r.hypotheses[0]!;
    const l = top.layout;
    const layoutSame =
      l.boxNumbers?.[0] === b.boxNumbers[0] && l.boxNumbers?.[1] === b.boxNumbers[1] && (l.rowStride ?? null) === b.rowStride && l.headerLength === b.headerLength && l.runMarkerMask === b.runMarkerMask && (l.tableTailLength ?? 0) === b.tableTailLength && (l.tableTailOffset ?? null) === b.tableTailOffset;
    if (layoutSame) same++;
    else problems.push(`${s.id}: rank-1 layout differs from the T-06 baseline`);
    if (top.confidence < b.confidence) problems.push(`${s.id}: confidence fell from ${b.confidence} to ${top.confidence}`);
    const fired = r.evidence.filter((e) => generic.includes(e.elementId));
    rows.push(
      [
        `### ${s.id} (${bytes.length} bytes)`,
        `- Rank-1 confidence: T-06 ${b.confidence}, T-07 ${top.confidence}. Evidence records: T-06 ${b.evidenceCount}, T-07 ${r.evidence.length}.`,
        `- Rank-1 layout equals T-06 (and so the spike): **${layoutSame ? 'yes' : 'NO'}**.`,
        `- Generic detectors fired: ${fired.length ? '' : 'none'}`,
        ...fired.map((e) => `  - ${e.elementId} (confidence ${e.confidence}): ${e.byteRanges.map((x) => `${x.start}..${x.end}`).join(', ')}. ${e.rule}`),
        '',
      ].join('\n'),
    );
  }
  const totalFired = new Map<string, number>();
  for (const row of rows) for (const g of generic) if (row.includes(`  - ${g} (`)) totalFired.set(g, (totalFired.get(g) ?? 0) + 1);
  const md = [
    '# Golden report v2 (T-07 analyzer v2)',
    '',
    `Rank-1 layout equals the T-06 layout (which equals the Gate 0 spike layout) on **${same} of ${samples.length}** tuning samples. Rank-1 confidence fell on **${problems.filter((p) => p.includes('fell')).length}** samples.`,
    '',
    `Samples on which each generic detector fired: ${generic.map((g) => `${g} ${totalFired.get(g) ?? 0}`).join(', ')}.`,
    '',
    'The detectors add supporting evidence only. They do not change any confidence or ranking, because rank-1 confidence was already 1 on every sample (T-06), so there was no room to raise it. A detector that fires on no sample, or on all of them, did not help tell samples apart.',
    '',
    'This is a tuned score, not a blind one. The tie-break, the search lists and the new detector thresholds in `src/engine/config.ts` are guesses chosen with these samples in view. All samples share one generator. The held-out file was not read. The analyzer returns layouts, not pixels.',
    '',
    ...rows,
  ].join('\n');
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync('docs/verification/golden-report-v2.md', md);
  expect(problems).toEqual([]);
});
