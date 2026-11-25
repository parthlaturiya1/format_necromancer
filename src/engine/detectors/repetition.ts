import type { EngineConfig } from '../config';
import type { ByteRange } from '../types';
import type { WorkMeter } from '../work';

export type RepeatCandidate =
  | { kind: 'byte-run'; range: ByteRange; value: number }
  | { kind: 'structure'; range: ByteRange; size: number; copies: number };

/**
 * Repetition detector. Finds (1) runs of one repeated byte and (2) fixed-size blocks that repeat
 * back to back, exactly. Pure: bytes and config in, candidates out, sorted by start then kind.
 * Candidates are statistics about the bytes; they name no format.
 */
export function detectRepetition(bytes: Uint8Array, config: EngineConfig, meter?: WorkMeter): RepeatCandidate[] {
  const out: RepeatCandidate[] = [];
  const n = bytes.length;
  meter?.spend(n * (1 + config.repeatStructSizes.length)); // one pass for byte runs, one per structure size
  const cap = config.maxGenericCandidates;

  for (let i = 0; i < n && out.length < cap; ) {
    let j = i + 1;
    while (j < n && bytes[j] === bytes[i]) j++;
    if (j - i >= config.repeatMinRun) out.push({ kind: 'byte-run', range: { start: i, end: j }, value: bytes[i]! });
    i = j;
  }

  const structs: RepeatCandidate[] = [];
  for (const size of config.repeatStructSizes) {
    // Length of the exact period-`size` stretch ending at each position; a stretch of equal bytes is a byte run, skipped here.
    let streak = 0;
    for (let i = size; i <= n && structs.length < cap * 4; i++) {
      const same = i < n && bytes[i] === bytes[i - size];
      if (same) {
        streak++;
        continue;
      }
      const total = streak + size; // bytes covered by the repeating stretch
      const copies = Math.floor(total / size);
      if (streak > 0 && copies >= config.repeatMinCopies && !uniform(bytes, i - total, i)) {
        structs.push({ kind: 'structure', range: { start: i - total, end: i - total + copies * size }, size, copies });
      }
      streak = 0;
    }
  }
  structs.sort((a, b) => b.range.end - b.range.start - (a.range.end - a.range.start) || a.range.start - b.range.start || (a as { size: number }).size - (b as { size: number }).size);
  // Keep the longest stretches that do not overlap one already kept.
  for (const s of structs) {
    if (out.length >= cap * 2) break;
    if (!out.some((o) => o.kind === 'structure' && s.range.start < o.range.end && o.range.start < s.range.end)) out.push(s);
  }
  return out.sort((a, b) => a.range.start - b.range.start || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));
}

function uniform(bytes: Uint8Array, start: number, end: number): boolean {
  for (let i = start + 1; i < end; i++) if (bytes[i] !== bytes[start]) return false;
  return true;
}
