import { defaultConfig, type EngineConfig } from './config';
import { detectBoxNumbers, type BoxCandidate } from './detectors/box-numbers';
import { detectHeaderBlocks, type HeaderCandidate } from './detectors/header-block';
import { detectRowStride, type StrideCandidate } from './detectors/row-stride';
import { createEvidence, sortEvidence } from './evidence';
import type { AnalysisResult, ByteRange, Evidence, Hypothesis, Layout } from './types';

type Draft = { header: HeaderCandidate; box?: BoxCandidate; stride?: StrideCandidate; confidence: number };

const round3 = (x: number) => Math.round(x * 1000) / 1000;
const area = (d: Draft) => (d.box ? d.box.width * d.box.height : 0);
/** Number of trailing zero bits of the header size. 0 counts as 0 (not round). */
function roundness(n: number): number {
  let t = 0;
  while (n > 0 && n % 2 === 0) {
    n /= 2;
    t++;
  }
  return t;
}

/** Confidence: exact body decode 0.3, box inside header 0.25, rows fit the decoded length 0.25, end table 0.1, stride number found in header 0.1. */
function score(d: Draft): number {
  let c = 0.3;
  if (d.box) c += 0.25;
  if (d.stride) c += 0.25 + (d.stride.numberOffset >= 0 ? 0.1 : 0);
  if (d.header.tailLength > 0) c += 0.1;
  return round3(c);
}

/**
 * Tie-break (R-A10, design.md): higher confidence, then larger decoded area, then rounder header size
 * (more trailing zero bits), then smaller header, smaller end table, smaller mask, smaller box offset.
 * The area and roundness rules were tuned on the tuning set during the Gate 0 spike.
 */
function compare(a: Draft, b: Draft): number {
  return (
    b.confidence - a.confidence ||
    area(b) - area(a) ||
    roundness(b.header.headerLength) - roundness(a.header.headerLength) ||
    a.header.headerLength - b.header.headerLength ||
    a.header.tailLength - b.header.tailLength ||
    a.header.runMarkerMask - b.header.runMarkerMask ||
    (a.box?.offset ?? -1) - (b.box?.offset ?? -1)
  );
}

function layoutOf(d: Draft): Layout {
  const l: Layout = { headerLength: d.header.headerLength, runMarkerMask: d.header.runMarkerMask };
  if (d.box) l.boxNumbers = [d.box.width, d.box.height];
  if (d.stride) l.rowStride = d.stride.rowStride;
  if (d.header.tailLength > 0) l.tableTailOffset = -d.header.tailLength; // fixed below once length is known
  return l;
}

const sameLayout = (a: Draft, b: Draft) =>
  a.header.headerLength === b.header.headerLength &&
  a.header.tailLength === b.header.tailLength &&
  a.header.runMarkerMask === b.header.runMarkerMask &&
  a.box?.width === b.box?.width &&
  a.box?.height === b.box?.height &&
  a.stride?.rowStride === b.stride?.rowStride;

function whyLost(loser: Draft, winner: Draft): string {
  if (loser.confidence < winner.confidence) {
    const gaps: string[] = [];
    if (!loser.box && winner.box) gaps.push('no size numbers were found in its header');
    else if (loser.box && !loser.stride && winner.stride) gaps.push('its rows do not fit the decoded length');
    if (loser.header.tailLength === 0 && winner.header.tailLength > 0) gaps.push('it leaves no end table');
    if (loser.stride && winner.stride && loser.stride.numberOffset < 0 && winner.stride.numberOffset >= 0) gaps.push('its row length is not stored in the header');
    return `Lower confidence (${loser.confidence} against ${winner.confidence}): ${gaps.length ? gaps.join(', ') : 'it explains less of the file'}.`;
  }
  if (area(loser) < area(winner)) return `Same confidence, but it decodes a smaller area (${area(loser)} against ${area(winner)}).`;
  if (roundness(loser.header.headerLength) < roundness(winner.header.headerLength)) return `Same confidence and area, but its header size (${loser.header.headerLength} bytes) is less round than ${winner.header.headerLength}.`;
  return 'Same confidence, area and header roundness; lost on the fixed order of header size, table size, mask and size-number position.';
}

function unrecovered(reason: string): AnalysisResult {
  return { status: 'unrecovered', reason };
}

function run(bytes: Uint8Array, config: EngineConfig): AnalysisResult {
  const n = bytes.length;
  if (n === 0) return unrecovered('The input is empty.');
  if (n < config.minInputBytes) return unrecovered(`The input has ${n} bytes, fewer than the ${config.minInputBytes} needed to look for a layout.`);
  if (n > config.maxInputBytes) return unrecovered(`The input has ${n} bytes, more than the ${config.maxInputBytes} byte limit.`);

  const headers = detectHeaderBlocks(bytes, config);
  if (headers.length === 0) return unrecovered('No header size, end-table size and run mask made the body decode using every byte.');
  const boxes = detectBoxNumbers(bytes, config);

  const drafts: Draft[] = [];
  for (const header of headers) {
    let matched = false;
    for (const box of boxes) {
      if (box.offset + 8 > header.headerLength) continue;
      const stride = detectRowStride(bytes, config, header, box);
      if (stride) {
        drafts.push({ header, box, stride, confidence: 0 });
        matched = true;
      }
    }
    if (!matched) drafts.push({ header, confidence: 0 });
  }
  for (const d of drafts) d.confidence = score(d);
  drafts.sort(compare);
  const kept: Draft[] = [];
  for (const d of drafts) {
    if (kept.length >= config.maxHypotheses) break;
    if (!kept.some((k) => sameLayout(k, d))) kept.push(d);
  }
  const winner = kept[0]!;

  const hypotheses: Hypothesis[] = kept.map((d, i) => {
    const bodyEnd = n - d.header.tailLength;
    const ranges: ByteRange[] = [];
    if (d.header.headerLength > 0) ranges.push({ start: 0, end: d.header.headerLength });
    ranges.push({ start: d.header.headerLength, end: bodyEnd });
    if (d.header.tailLength > 0) ranges.push({ start: bodyEnd, end: n });
    const layout = layoutOf(d);
    if (d.header.tailLength > 0) {
      layout.tableTailOffset = bodyEnd;
      layout.tableTailLength = d.header.tailLength;
    }
    const h: Hypothesis = { id: `h${i + 1}`, rank: i + 1, confidence: d.confidence, ranges, layout };
    if (i > 0) h.lostBecause = whyLost(d, winner);
    return h;
  });

  const id = 'h1';
  const c = winner.confidence;
  const hl = winner.header.headerLength;
  const bodyEnd = n - winner.header.tailLength;
  const ev: Evidence[] = [];
  if (hl > 0) ev.push(createEvidence({ elementId: 'header-block', byteRanges: [{ start: 0, end: hl }], rule: `Smallest tried header size (${hl} bytes) after which the rest decodes with every byte used and rows that fit.`, confidence: c, hypothesisId: id }));
  if (winner.box) ev.push(createEvidence({ elementId: 'size-numbers', byteRanges: [{ start: winner.box.offset, end: winner.box.offset + 8 }], rule: `Four 16-bit numbers at byte ${winner.box.offset} read as a box ${winner.box.width} by ${winner.box.height}.`, confidence: c, hypothesisId: id }));
  if (winner.stride) {
    const at = winner.stride.numberOffset;
    ev.push(createEvidence({
      elementId: 'row-stride',
      byteRanges: [at >= 0 ? { start: at, end: at + 2 } : { start: hl, end: bodyEnd }],
      rule: at >= 0 ? `Row length ${winner.stride.rowStride} fits the decoded length and is stored as a 16-bit number at byte ${at}.` : `Row length ${winner.stride.rowStride} is the decoded length divided by the height; no matching number in the header.`,
      confidence: at >= 0 ? c : round3(c * 0.8),
      hypothesisId: id,
    }));
  }
  ev.push(createEvidence({ elementId: 'body', byteRanges: [{ start: hl, end: bodyEnd }], rule: `Bytes ${hl} to ${bodyEnd} decode with run mask ${winner.header.runMarkerMask} using every byte, giving ${winner.header.bodyOutputLength} values.`, confidence: c, hypothesisId: id }));
  if (winner.header.tailLength > 0) ev.push(createEvidence({ elementId: 'table-tail', byteRanges: [{ start: bodyEnd, end: n }], rule: `Last ${winner.header.tailLength} bytes tried as a table block; the body before it decodes exactly.`, confidence: round3(c * 0.9), hypothesisId: id }));
  return { status: 'ok', hypotheses, evidence: sortEvidence(ev) };
}

/** Analyze the bytes of one file. Never throws. Deterministic: no clock, no randomness, no I/O. */
export function analyze(bytes: Uint8Array, config: EngineConfig = defaultConfig): AnalysisResult {
  try {
    return run(bytes, config);
  } catch (e) {
    return unrecovered(`The analyzer failed on this input: ${e instanceof Error ? e.message : 'unknown error'}.`);
  }
}
