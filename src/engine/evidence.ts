import type { AnalysisResult, ByteRange, Evidence } from './types';

/** Build an Evidence record. Copies the ranges. Does not validate: use validateEvidence. */
export function createEvidence(input: {
  elementId: string;
  byteRanges: ReadonlyArray<ByteRange>;
  rule: string;
  confidence: number;
  hypothesisId: string;
}): Evidence {
  return {
    elementId: input.elementId,
    byteRanges: input.byteRanges.map((r) => ({ start: r.start, end: r.end })),
    rule: input.rule,
    confidence: input.confidence,
    hypothesisId: input.hypothesisId,
  };
}

function rangeProblems(r: ByteRange, fileLength: number, where: string): string[] {
  if (!Number.isInteger(r.start) || !Number.isInteger(r.end)) return [`${where}: range ends must be integers`];
  if (!(r.start >= 0 && r.start < r.end && r.end <= fileLength)) {
    return [`${where}: range ${r.start}..${r.end} must satisfy 0 <= start < end <= ${fileLength}`];
  }
  return [];
}

const confidenceOk = (c: number) => Number.isFinite(c) && c >= 0 && c <= 1;

/** R-E2, R-E3, R-E4. Returns problems; empty means valid. */
export function validateEvidence(e: Evidence, fileLength: number): string[] {
  const p: string[] = [];
  const id = `evidence ${JSON.stringify(e.elementId)}`;
  if (e.elementId === '') p.push(`${id}: elementId is empty`);
  if (e.hypothesisId === '') p.push(`${id}: hypothesisId is empty`);
  if (e.rule.trim() === '') p.push(`${id}: rule is empty`);
  if (!confidenceOk(e.confidence)) p.push(`${id}: confidence ${e.confidence} must be finite and in [0, 1]`);
  if (e.byteRanges.length === 0) p.push(`${id}: no byte ranges`);
  e.byteRanges.forEach((r, i) => p.push(...rangeProblems(r, fileLength, `${id} range ${i}`)));
  return p;
}

/** R-E1, R-E4, R-A3 and R-E2/E3 on every record. Returns problems; empty means valid. */
export function validateResult(result: AnalysisResult, fileLength: number): string[] {
  if (result.status === 'unrecovered') {
    return result.reason.trim() === '' ? ['unrecovered result needs a non-empty reason'] : [];
  }
  const p: string[] = [];
  const hypIds = new Set<string>();
  for (const h of result.hypotheses) {
    const id = `hypothesis ${JSON.stringify(h.id)}`;
    if (h.id === '') p.push(`${id}: id is empty`);
    if (hypIds.has(h.id)) p.push(`${id}: duplicate hypothesis id`);
    hypIds.add(h.id);
    if (!Number.isInteger(h.rank) || h.rank < 1) p.push(`${id}: rank must be an integer >= 1`);
    if (!confidenceOk(h.confidence)) p.push(`${id}: confidence ${h.confidence} must be finite and in [0, 1]`);
    h.ranges.forEach((r, i) => p.push(...rangeProblems(r, fileLength, `${id} range ${i}`)));
  }
  const elementIds = new Set<string>();
  for (const e of result.evidence) {
    p.push(...validateEvidence(e, fileLength));
    if (elementIds.has(e.elementId)) p.push(`evidence ${JSON.stringify(e.elementId)}: more than one record for this element`);
    elementIds.add(e.elementId);
    if (!hypIds.has(e.hypothesisId)) p.push(`evidence ${JSON.stringify(e.elementId)}: hypothesisId ${JSON.stringify(e.hypothesisId)} is not in the result`);
  }
  return p;
}

const cmp = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0);

function cmpEvidence(a: Evidence, b: Evidence): number {
  const first = cmp(a.elementId, b.elementId) || cmp(a.hypothesisId, b.hypothesisId) || cmp(a.rule, b.rule) || cmp(a.confidence, b.confidence);
  if (first !== 0) return first;
  const n = Math.min(a.byteRanges.length, b.byteRanges.length);
  for (let i = 0; i < n; i++) {
    const x = a.byteRanges[i]!;
    const y = b.byteRanges[i]!;
    const c = cmp(x.start, y.start) || cmp(x.end, y.end);
    if (c !== 0) return c;
  }
  return cmp(a.byteRanges.length, b.byteRanges.length);
}

/** R-E6. Returns a new array in a fixed order (code-unit compare, no locale). Array.sort is stable. */
export function sortEvidence(list: ReadonlyArray<Evidence>): Evidence[] {
  return [...list].sort(cmpEvidence);
}
