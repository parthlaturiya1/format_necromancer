import type { Recovered } from './recover';
import type { AnalysisResult } from './types';
import type { VerificationReport } from './verify';

type Range = { start: number; end: number };
export type EvidenceReport = {
  analysis:
    | { status: 'ok'; hypotheses: Array<{ id: string; rank: number; confidence: number; layout: object; ranges: Range[]; lostBecause: string | null }>; evidence: Array<{ elementId: string; byteRanges: Range[]; rule: string; confidence: number; hypothesisId: string }> }
    | { status: 'unrecovered'; reason: string };
  recovery:
    | { status: 'ok'; width: number; height: number; hypothesisId: string; confidence: number; rows: Array<{ index: number; status: string; evidenceId: string; byteRanges: Range[]; rule: string; confidence: number }> }
    | { status: 'unrecovered'; reason: string };
  verification: VerificationReport;
};

/** Plain JSON-safe report. Holds byte ranges only, never file bytes or pixels (design.md). Deterministic. */
export function buildEvidenceReport(analysis: AnalysisResult, recovered: Recovered, verification: VerificationReport): EvidenceReport {
  const range = (r: Range): Range => ({ start: r.start, end: r.end });
  const a: EvidenceReport['analysis'] =
    analysis.status === 'ok'
      ? {
          status: 'ok',
          hypotheses: analysis.hypotheses.map((h) => ({
            id: h.id,
            rank: h.rank,
            confidence: h.confidence,
            layout: { ...h.layout, boxNumbers: h.layout.boxNumbers ? [...h.layout.boxNumbers] : undefined },
            ranges: h.ranges.map(range),
            lostBecause: h.lostBecause ?? null,
          })),
          evidence: analysis.evidence.map((e) => ({ elementId: e.elementId, byteRanges: e.byteRanges.map(range), rule: e.rule, confidence: e.confidence, hypothesisId: e.hypothesisId })),
        }
      : { status: 'unrecovered', reason: analysis.reason };
  const r: EvidenceReport['recovery'] =
    recovered.status === 'ok'
      ? {
          status: 'ok',
          width: recovered.width,
          height: recovered.height,
          hypothesisId: recovered.hypothesisId,
          confidence: recovered.confidence,
          rows: recovered.rows.map((row) => {
            const ev = recovered.evidence.find((e) => e.elementId === row.evidenceId);
            return { index: row.index, status: row.status, evidenceId: row.evidenceId, byteRanges: (ev?.byteRanges ?? []).map(range), rule: ev?.rule ?? '', confidence: ev?.confidence ?? 0 };
          }),
        }
      : { status: 'unrecovered', reason: recovered.reason };
  // The JSON round trip drops undefined fields and proves the result is JSON-safe.
  return JSON.parse(JSON.stringify({ analysis: a, recovery: r, verification })) as EvidenceReport;
}
