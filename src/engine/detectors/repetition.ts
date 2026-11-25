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
  meter?.spend(n * (1 + config.repeatStructSizes.length)); // one pass for byte runs, one per structure size (upper bound for the probes)
  // T-21d: each structure size is also charged below for the stretch reads it makes, which can pass n on repeating data.
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
    // A stretch of equal-to-`size`-earlier bytes counts only when it is at least `need` long (copies >= repeatMinCopies).
    // T-21d: such a stretch must cover a multiple of `need`, so only those positions are probed, then the stretch is
    // measured outward. Same stretches in the same order as stepping one position at a time; about `need` times fewer reads on data without repeats.
    const need = Math.max(1, (config.repeatMinCopies - 1) * size);
    let i = size; // first position not yet part of a handled stretch
    let work = 0; // stretch reads for this size, charged to the meter after it
    while (structs.length < cap * 4) {
      let p = Math.ceil(i / need) * need;
      while (p < n && bytes[p] !== bytes[p - size]) p += need;
      if (p >= n) break;
      let s = p;
      while (s > i && bytes[s - 1] === bytes[s - 1 - size]) s--;
      let e = p;
      while (e < n && bytes[e] === bytes[e - size]) e++;
      i = e + 1;
      const streak = e - s;
      work += 2 * streak; // measuring the stretch, then the uniform check
      const total = streak + size; // bytes covered by the repeating stretch
      const copies = Math.floor(total / size);
      if (streak > 0 && copies >= config.repeatMinCopies && !uniform(bytes, e - total, e)) {
        structs.push({ kind: 'structure', range: { start: e - total, end: e - total + copies * size }, size, copies });
      }
    }
    meter?.spend(work);
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
