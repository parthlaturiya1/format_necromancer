// Throwaway blind-test runner (T-12). NOT part of verify. Phase via BLIND_PHASE=recover|compare.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { expect, it } from 'vitest';
import { runPipeline } from '../../src/engine/pipeline';
import { decodePng, encodePng } from '../../src/engine/png';
import { verify } from '../../src/engine/verify';
import { nodeInflate } from '../engine/helpers/node-inflate';

const OUT = 'docs/verification/blind';
it('blind', async () => {
  if (process.env.BLIND_PHASE === 'recover') {
    const bytes = new Uint8Array(readFileSync('corpus/heldout/heldout-01.pcx'));
    const t0 = performance.now();
    const r = runPipeline(bytes);
    const ms = performance.now() - t0;
    const a = r.analysis;
    const out: Record<string, unknown> = { bytes: bytes.length, timingMs: Math.round(ms * 10) / 10, analysisStatus: a.status, recoveredStatus: r.recovered.status };
    if (a.status === 'ok') {
      out.hypotheses = a.hypotheses.map((h) => ({ id: h.id, rank: h.rank, confidence: h.confidence, layout: h.layout, lostBecause: h.lostBecause }));
      out.evidenceCount = a.evidence.length;
    } else out.analysisReason = a.reason;
    if (r.recovered.status === 'ok') {
      const rc = r.recovered;
      const counts: Record<string, number> = {};
      for (const row of rc.rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
      Object.assign(out, { width: rc.width, height: rc.height, confidence: rc.confidence, hypothesisId: rc.hypothesisId, rowStatusCounts: counts, recoveredEvidenceCount: rc.evidence.length });
      writeFileSync(`${OUT}/heldout-recovered.rgb`, rc.rgb);
      writeFileSync(`${OUT}/heldout-recovered.png`, await encodePng(rc.width, rc.height, rc.rgb, async (d) => new Uint8Array(deflateSync(d))));
    } else out.reason = r.recovered.reason;
    writeFileSync(`${OUT}/heldout-result.json`, JSON.stringify(out, null, 2));
  } else if (process.env.BLIND_PHASE === 'compare') {
    const res = JSON.parse(readFileSync(`${OUT}/heldout-result.json`, 'utf8'));
    const ref = await decodePng(new Uint8Array(readFileSync(`${OUT}/heldout-reference.png`)), nodeInflate);
    const rgb = res.recoveredStatus === 'ok' ? new Uint8Array(readFileSync(`${OUT}/heldout-recovered.rgb`)) : null;
    const rec = rgb ? { status: 'ok' as const, width: res.width, height: res.height, rgb, rows: [], evidence: [], hypothesisId: res.hypothesisId, confidence: res.confidence } : { status: 'unrecovered' as const, reason: String(res.reason) };
    const v = verify(rec, ref);
    writeFileSync(`${OUT}/heldout-compare.json`, JSON.stringify({ reference: { width: ref.width, height: ref.height }, report: { ...v, mismatches: 'mismatches' in v ? v.mismatches.slice(0, 10) : undefined } }, null, 2));
  } else expect.fail('no phase');
});
