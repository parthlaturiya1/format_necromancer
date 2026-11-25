// Golden corpus report (T-06). Reads tuning samples ONLY through list-tuning-samples.mjs.
// Writes docs/verification/golden-report.md, then fails if any rank-1 layout differs from the Gate 0 spike layout.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { runPipeline } from '../../src/engine/pipeline';
import { decodePng } from '../../src/engine/png';
import { verify } from '../../src/engine/verify';
import { nodeInflate } from './helpers/node-inflate';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

type Sample = { id: string; path: string };
type Spike = { width: number; height: number; stride: number; header: number; tail: number; tailAt: number; mask: number };

it('writes the golden report and rank 1 matches the spike on every tuning sample', async () => {
  const spike = readFileSync('docs/verification/gate0-spike.md', 'utf8');
  const spikeLayouts = new Map<string, Spike>();
  for (const m of spike.matchAll(/^\s+([\w-]+-\d+x\d+): match .*?\| (\d+)x(\d+) stride (\d+) header (\d+) boxAt (\d+) tail (\d+) paletteAt (\d+) mask (0x[0-9a-f]+)/gm)) {
    spikeLayouts.set(m[1]!, { width: +m[2]!, height: +m[3]!, stride: +m[4]!, header: +m[5]!, tail: +m[7]!, tailAt: +m[8]!, mask: parseInt(m[9]!, 16) });
  }
  const samples: Sample[] = listTuningSamples();
  expect(samples.length).toBe(11);
  expect(spikeLayouts.size).toBe(11);

  const rows: string[] = [];
  let match = 0;
  for (const s of samples) {
    const bytes = new Uint8Array(readFileSync(s.path));
    const r = analyze(bytes);
    if (r.status !== 'ok') {
      rows.push(`### ${s.id}\n- unrecovered. ${r.reason}\n`);
      continue;
    }
    const sp = spikeLayouts.get(s.id)!;
    const top = r.hypotheses[0]!;
    const l = top.layout;
    const [w, h] = l.boxNumbers ?? [0, 0];
    const ok = w === sp.width && h === sp.height && l.rowStride === sp.stride && l.headerLength === sp.header && l.runMarkerMask === sp.mask && (l.tableTailLength ?? 0) === sp.tail && (l.tableTailOffset ?? 0) + 1 === sp.tailAt; // the spike's paletteAt is the byte after the 1-byte separator that starts the table block
    if (ok) match++;
    const box = r.evidence.find((e) => e.elementId === 'size-numbers')?.byteRanges[0];
    rows.push(
      [
        `### ${s.id} (${bytes.length} bytes)`,
        `- Rank 1 (${top.id}): box ${w}x${h}${box ? ` at byte ${box.start}` : ''}, row length ${l.rowStride ?? 'none'}, header ${l.headerLength} bytes, run mask 0x${(l.runMarkerMask ?? 0).toString(16)}, end table ${l.tableTailLength ?? 0} bytes at ${l.tableTailOffset ?? '-'}.`,
        `- Confidence: ${top.confidence}. Evidence records: ${r.evidence.length}. Hypotheses: ${r.hypotheses.length}.`,
        `- Matches the spike layout: **${ok ? 'yes' : 'NO'}**.`,
        '- Why the others lost:',
        ...r.hypotheses.slice(1, 4).map((x) => `  - ${x.id} (confidence ${x.confidence}, header ${x.layout.headerLength}, mask 0x${(x.layout.runMarkerMask ?? 0).toString(16)}, table ${x.layout.tableTailLength ?? 0}, box ${(x.layout.boxNumbers ?? []).join('x') || 'none'}): ${x.lostBecause}`),
        ...(r.hypotheses.length > 4 ? [`  - ${r.hypotheses.length - 4} more, each with a recorded reason.`] : []),
        '',
      ].join('\n'),
    );
  }
  // T-08 recovery. Order matters (R-R8): recover first from the sample bytes, THEN load the reference and compare here (test-side; the verifier is T-09).
  const recRows: string[] = [];
  let exact = 0;
  for (const s of samples as Array<Sample & { reference: { path: string } }>) {
    const bytes = new Uint8Array(readFileSync(s.path));
    const { recovered: rec } = runPipeline(bytes);
    if (rec.status !== 'ok') {
      recRows.push(`- ${s.id}: unrecovered. ${rec.reason}`);
      continue;
    }
    const ref = await decodePng(new Uint8Array(readFileSync(s.reference.path)), nodeInflate);
    const v = verify(rec, ref); // src/engine/verify.ts, reference passed in only after recovery (R-V6)
    if (v.mode === 'reference' && v.exact) exact++;
    const count = (st: string) => rec.rows.filter((r) => r.status === st).length;
    const verdict = v.mode === 'reference' ? (v.exact ? '**exact**, 0 mismatches' : `NOT exact (${v.reason ?? `${v.mismatchCount} pixels differ, first at row ${v.mismatches[0]?.row} col ${v.mismatches[0]?.col}`})`) : v.note;
    recRows.push(`- ${s.id}: verifier: ${verdict}; rows ok ${count('ok')} / uncertain ${count('uncertain')} / unexplained ${count('unexplained')}, confidence ${rec.confidence}.`);
  }  const recBase = JSON.parse(readFileSync('scripts/golden/recover-baseline.json', 'utf8')) as { exact: number };

  const md = [
    '# Golden report (T-06 analyzer v1, T-08 recoverer)',
    '',
    `## Recovery (T-08): **${exact} of ${samples.length}** tuning samples recovered exactly against the reference`,
    '',
    'Reference pixels were loaded only after recovery, and compared by the verifier (`src/engine/verify.ts`, T-09). The recoverer reads no reference. The run decoder (`src/engine/decoders/run-length-rows.ts`) is format-aware and disclosed. Row weights and thresholds in `src/engine/config.ts` are guesses. Exact on the tuning set is not a blind result (the blind test is T-12). Held-out file not read.',
    '',
    ...recRows,
    '',
    '## Analysis (T-06)',
    '',
    '',
    `Rank-1 layout equals the Gate 0 spike layout on **${match} of ${samples.length}** tuning samples.`,
    '',
    'This is a tuned score, not a blind one. The tie-break (larger area, then rounder header) and the search lists in `src/engine/config.ts` come from the spike, which chose them after seeing these samples. All samples share one generator. The held-out file was not read. The analyzer returns layouts, not pixels. The trial decode in `src/engine/trial-decode.ts` is format-aware and disclosed.',
    '',
    ...rows,
  ].join('\n');
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync('docs/verification/golden-report.md', md);
  expect(match).toBe(samples.length);
  expect(exact).toBeGreaterThanOrEqual(recBase.exact); // no-worse baseline: the exact count must not drop
});


