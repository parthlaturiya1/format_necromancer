// Golden corpus report (T-06). Reads tuning samples ONLY through list-tuning-samples.mjs.
// Writes docs/verification/golden-report.md, then fails if any rank-1 layout differs from the Gate 0 spike layout.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { analyze } from '../../src/engine/analyze';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

type Sample = { id: string; path: string };
type Spike = { width: number; height: number; stride: number; header: number; tail: number; tailAt: number; mask: number };

it('writes the golden report and rank 1 matches the spike on every tuning sample', () => {
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
  const md = [
    '# Golden report (T-06 analyzer v1)',
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
});

