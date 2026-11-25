// Throwaway blind runner (W-1). NOT part of verify. Phase via WILD_PHASE=recover|compare.
// Runs from a clean checkout of the frozen commit (cwd). Reads files from WILD_CORPUS, writes to WILD_OUT.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { expect, it } from 'vitest';
import { runPipeline } from '../../src/engine/pipeline';
import { decodePng, encodePng } from '../../src/engine/png';
import { verify } from '../../src/engine/verify';
import { nodeInflate } from '../engine/helpers/node-inflate';

const OUT = process.env.WILD_OUT!;
const CORPUS = process.env.WILD_CORPUS!;
const ids: string[] = JSON.parse(readFileSync(`${CORPUS}/corpus/wild/manifest.json`, 'utf8').replace(/^\uFEFF/, '')).files.map((f: { id: string }) => f.id);

it('wild', async () => {
  if (process.env.WILD_PHASE === 'recover') {
    for (const id of ids) {
      const bytes = new Uint8Array(readFileSync(`${CORPUS}/corpus/wild/${id}.pcx`));
      const t0 = performance.now();
      const r = runPipeline(bytes); // ONCE per file, default config
      const ms = performance.now() - t0;
      const a = r.analysis;
      const out: Record<string, unknown> = { id, bytes: bytes.length, timingMs: Math.round(ms * 10) / 10, analysisStatus: a.status, recoveredStatus: r.recovered.status };
      if (a.status === 'ok') {
        out.rank1 = a.hypotheses[0]?.layout;
        out.hypothesisCount = a.hypotheses.length;
      } else out.analysisReason = a.reason;
      if (r.recovered.status === 'ok') {
        const rc = r.recovered;
        const counts: Record<string, number> = {};
        for (const row of rc.rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
        Object.assign(out, { width: rc.width, height: rc.height, confidence: rc.confidence, hypothesisId: rc.hypothesisId, rowStatusCounts: counts });
        writeFileSync(`${OUT}/${id}-recovered.png`, await encodePng(rc.width, rc.height, rc.rgb, async (d) => new Uint8Array(deflateSync(d))));
      } else out.reason = r.recovered.reason;
      writeFileSync(`${OUT}/${id}-result.json`, JSON.stringify(out, null, 2));
    }
  } else if (process.env.WILD_PHASE === 'compare') {
    for (const id of ids) {
      const res = JSON.parse(readFileSync(`${OUT}/${id}-result.json`, 'utf8'));
      const ref = await decodePng(new Uint8Array(readFileSync(`${OUT}/${id}-reference.png`)), nodeInflate);
      const rgb = res.recoveredStatus === 'ok' ? (await decodePng(new Uint8Array(readFileSync(`${OUT}/${id}-recovered.png`)), nodeInflate)).rgb : null;
      const rec = rgb ? { status: 'ok' as const, width: res.width, height: res.height, rgb, rows: [], evidence: [], hypothesisId: res.hypothesisId, confidence: res.confidence } : { status: 'unrecovered' as const, reason: String(res.reason) };
      const v = verify(rec, ref);
      writeFileSync(`${OUT}/${id}-compare.json`, JSON.stringify({ reference: { width: ref.width, height: ref.height }, report: { ...v, mismatches: 'mismatches' in v ? v.mismatches.slice(0, 10) : undefined } }, null, 2));
    }
  } else expect.fail('no phase');
});
