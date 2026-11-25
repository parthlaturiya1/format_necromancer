import { defaultConfig, type EngineConfig } from './config';
import { detectBoxNumbers, type BoxCandidate } from './detectors/box-numbers';
import { detectHeaderBlocks, type HeaderCandidate } from './detectors/header-block';
import { detectPalette } from './detectors/palette';
import { detectRepetition } from './detectors/repetition';
import { detectRowStride, type StrideCandidate } from './detectors/row-stride';
import { detectRunPairs } from './detectors/run-length';
import { detectTables } from './detectors/table-like';
import { createEvidence, sortEvidence } from './evidence';
import { createWorkMeter, workLimit, WORK_LIMIT_REASON, WorkLimitError, type WorkMeter } from './work';
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

/**
 * Analyzer v2 (T-07). The four generic detectors add SUPPORTING evidence to the rank-1 hypothesis.
 * Rule: they never change a hypothesis confidence, the ranking or the tie-break. Each record's
 * confidence is the rank-1 confidence times the detector's own measured share, so it can
 * never be higher than the layout it supports. Reason: rank-1 confidence is already at its cap of 1
 * on every tuning sample, so there is no room to raise it, and moving it would risk the T-06 order.
 * Records are in plain words and every range is inside the input.
 */
function genericEvidence(bytes: Uint8Array, config: EngineConfig, winner: Draft, hypothesisId: string, meter: WorkMeter): Evidence[] {
  const out: Evidence[] = [];
  const c = winner.confidence;
  const hl = winner.header.headerLength;
  const bodyEnd = bytes.length - winner.header.tailLength;
  const make = (elementId: string, byteRanges: ByteRange[], rule: string, share: number) =>
    out.push(createEvidence({ elementId, byteRanges: byteRanges.slice(0, config.maxGenericCandidates), rule, confidence: round3(c * Math.min(1, Math.max(0, share))), hypothesisId }));

  const rep = detectRepetition(bytes, config, meter);
  const runs = rep.filter((r) => r.kind === 'byte-run');
  const structs = rep.filter((r) => r.kind === 'structure');
  const sum = (l: { range: ByteRange }[]) => l.reduce((a, r) => a + r.range.end - r.range.start, 0);
  if (runs.length) make('repeat-runs', runs.map((r) => r.range), `${runs.length} stretch(es) of one repeated byte, each at least ${config.repeatMinRun} bytes long, ${sum(runs)} bytes in all.`, sum(runs) / bytes.length);
  if (structs.length) make('repeat-structures', structs.map((r) => r.range), `${structs.length} stretch(es) where a block of the same size repeats back to back at least ${config.repeatMinCopies} times, ${sum(structs)} bytes in all.`, sum(structs) / bytes.length);

  if (bodyEnd > hl) {
    const pairs = detectRunPairs(bytes.subarray(hl, bodyEnd), config, meter);
    const best = pairs.reduce<(typeof pairs)[number] | undefined>((a, p) => (!a || p.score > a.score ? p : a), undefined);
    if (best) make('run-pairs', [{ start: hl, end: bodyEnd }], `In the body, ${best.pairs} bytes whose top ${best.prefixBits} bit(s) are all set are followed by a byte that is not one (${Math.round(best.followShare * 100)}% of such bytes; random data would give about ${Math.round((1 - 2 ** -best.prefixBits) * 100)}%).`, best.followShare);
  }

  const pal = detectPalette(bytes, config, meter);
  if (pal.length) make('palette', pal.map((p) => p.range), `${pal.length} block(s) of ${pal.map((p) => p.entries).join(', ')} three-byte entries whose neighbours change by at most ${config.paletteMaxStep} per byte on average and are almost all different.`, Math.min(...pal.map((p) => p.distinct)));

  const tab = detectTables(bytes, config, meter);
  if (tab.length) make('table-records', tab.map((t) => t.range), `${tab.length} region(s) of fixed-width records (widths ${tab.map((t) => t.width).join(', ')} bytes) where between ${Math.round(config.tableMatchShare[0] * 100)}% and ${Math.round(config.tableMatchShare[1] * 100)}% of bytes equal the byte one record earlier.`, Math.min(...tab.map((t) => t.matchShare)));
  return out;
}

function unrecovered(reason: string): AnalysisResult {
  return { status: 'unrecovered', reason };
}

function run(bytes: Uint8Array, config: EngineConfig, meter: WorkMeter): AnalysisResult {
  const n = bytes.length;
  if (n === 0) return unrecovered('The input is empty.');
  if (n < config.minInputBytes) return unrecovered(`The input has ${n} bytes, fewer than the ${config.minInputBytes} needed to look for a layout.`);
  if (n > config.maxInputBytes) return unrecovered(`The input has ${n} bytes, more than the ${config.maxInputBytes} byte limit.`);

  const headers = detectHeaderBlocks(bytes, config, meter);
  if (headers.length === 0) return unrecovered('No header size, end-table size and run mask made the body decode using every byte.');
  const boxes = detectBoxNumbers(bytes, config, meter);

  const drafts: Draft[] = [];
  for (const header of headers) {
    let matched = false;
    for (const box of boxes) {
      if (box.offset + 8 > header.headerLength) continue;
      const stride = detectRowStride(bytes, config, header, box, meter);
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
  ev.push(...genericEvidence(bytes, config, winner, id, meter));
  return { status: 'ok', hypotheses, evidence: sortEvidence(ev) };
}

/**
 * Analyze the bytes of one file. Never throws. Deterministic: no clock, no randomness, no I/O.
 * `meter` is the shared work counter (T-21b); without one, a fresh meter with config.workBudget is made.
 */
export function analyze(bytes: Uint8Array, config: EngineConfig = defaultConfig, meter: WorkMeter = createWorkMeter(workLimit(config, bytes.length))): AnalysisResult {
  try {
    return run(bytes, config, meter);
  } catch (e) {
    if (e instanceof WorkLimitError) return unrecovered(WORK_LIMIT_REASON + '.');
    return unrecovered(`The analyzer failed on this input: ${e instanceof Error ? e.message : 'unknown error'}.`);
  }
}
