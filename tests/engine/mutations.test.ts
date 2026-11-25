// Mutation rule check (T-10, R-X3 in .kiro/specs/recovery/requirements.md). One rule for every file:
// exact against the trusted converter's decode of the MUTATED file itself (Pillow, build time,
// corpus/mutations/reference/), or unrecovered. When Pillow refused the file, the expected outcome is
// unrecovered, and any ok result with confidence >= 0.9 counts as wrong.
// FAIL on any file recovered, not exact, with confidence >= 0.9 (config.uncertainBelow, never changed here).
// Order (R-R8): recover from the mutated bytes first, then load the reference and verify.
// Side table (disclosed, not gated): the old rule, against the SOURCE sample's reference.
// Tuning samples only. Stats go to docs/verification/robustness-mutations.json for the report.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { defaultConfig } from '../../src/engine/config';
import { runPipeline } from '../../src/engine/pipeline';
import { decodePng } from '../../src/engine/png';
import { verify, type Reference } from '../../src/engine/verify';
import { nodeInflate } from './helpers/node-inflate';
// @ts-expect-error plain .mjs helper without type declarations
import { listTuningSamples } from '../../scripts/corpus/list-tuning-samples.mjs';

type Entry = { file: string; kind: string; param: string; source: string; bytes: number; reference: { path?: string; refused?: string } };
type Stat = { n: number; refusedByPillow: number; exact: number; unrecovered: number; lowConfWrong: number; maxLowConfWrong: number; highConfWrong: number };
const blank = (): Stat => ({ n: 0, refusedByPillow: 0, exact: 0, unrecovered: 0, lowConfWrong: 0, maxLowConfWrong: 0, highConfWrong: 0 });
const T = defaultConfig.uncertainBelow;
// Harness-only rule (conductor ruling 2026-11-25, R-X3): these kinds change only the first (signature) byte; the pixels are untouched,
// so their truth is the SOURCE sample's reference even though Pillow refuses the file. Never used in src/engine.
const SIGNATURE_ONLY = new Set(['first-byte-changed', 'first-byte-zeroed']);

function tally(st: Stat, conf: number, exact: boolean): boolean {
  if (exact) {
    st.exact++;
    return true;
  }
  if (conf >= T) {
    st.highConfWrong++;
    return false;
  }
  st.lowConfWrong++;
  st.maxLowConfWrong = Math.max(st.maxLowConfWrong, conf);
  return true;
}

it('every mutation file is exact (against Pillow on the mutated file) or unrecovered, never wrong with confidence >= 0.9', async () => {
  const manifest = JSON.parse(readFileSync('corpus/mutations/manifest.json', 'utf8')) as { entries: Entry[] };
  const srcRef = new Map<string, string>((listTuningSamples() as { id: string; reference: { path: string } }[]).map((s) => [s.id, s.reference.path]));
  const png = async (p: string): Promise<Reference> => decodePng(new Uint8Array(readFileSync(p)), nodeInflate);
  const stats: Record<string, Stat> = {};
  const old: Record<string, Stat> = {};
  const failures: string[] = [];
  const lowConf: string[] = [];
  expect(manifest.entries.length).toBeGreaterThan(0);
  for (const e of manifest.entries) {
    const st = (stats[e.kind] ??= blank());
    const ot = (old[e.kind] ??= blank());
    st.n++;
    ot.n++;
    if (e.reference.refused) st.refusedByPillow++;
    const { recovered: rec } = runPipeline(new Uint8Array(readFileSync(e.file)));
    if (rec.status !== 'ok') {
      expect(rec.reason.trim().length).toBeGreaterThan(0);
      st.unrecovered++;
      ot.unrecovered++;
      continue;
    }
    // References are loaded only now, after recovery (R-R8).
    let exact = false;
    const truth = SIGNATURE_ONLY.has(e.kind) ? srcRef.get(e.source)! : e.reference.path;
    if (truth) {
      const v = verify(rec, await png(truth));
      exact = v.mode === 'reference' && v.exact;
    }
    if (!tally(st, rec.confidence, exact)) failures.push(`${e.file}: recovered, not exact, confidence ${rec.confidence}${e.reference.refused && !SIGNATURE_ONLY.has(e.kind) ? ' (Pillow refused this file)' : ''}`);
    else if (!exact) lowConf.push(`${e.file}: confidence ${rec.confidence}`);
    const vo = verify(rec, await png(srcRef.get(e.source)!));
    tally(ot, rec.confidence, vo.mode === 'reference' && vo.exact);
  }
  mkdirSync('docs/verification', { recursive: true });
  writeFileSync('docs/verification/robustness-mutations.json', JSON.stringify({ files: manifest.entries.length, threshold: T, kinds: stats, oldRuleVsSourceReference: old, lowConfidenceWrong: lowConf, failures }, null, 1) + '\n');
  expect(failures).toEqual([]);
});
