import type { EngineConfig } from '../config';
import type { ByteRange } from '../types';

export type TableCandidate = { range: ByteRange; width: number; records: number; matchShare: number };

/**
 * Table-like detector. For each guessed record width w, cuts the input into blocks of
 * tableMinRecords records and measures the share of bytes equal to the byte one record earlier.
 * A block is record-like when that share lies inside tableMatchShare: some columns stay fixed
 * while others vary. Below the range it is unstructured; above it, plain repetition (see repetition.ts).
 * Neighbouring record-like blocks of the same width merge into one region. Fixed-width regions
 * of different widths that overlap keep the longer one.
 */
export function detectTables(bytes: Uint8Array, config: EngineConfig): TableCandidate[] {
  const n = bytes.length;
  const [lo, hi] = config.tableMatchShare;
  const found: TableCandidate[] = [];
  for (const w of config.tableRecordWidths) {
    const block = w * config.tableMinRecords;
    if (!Number.isInteger(w) || w < 1 || block + w > n) continue;
    let open: { start: number; end: number; matches: number } | null = null;
    const close = () => {
      if (!open) return;
      const compared = open.end - open.start;
      found.push({ range: { start: open.start, end: open.end }, width: w, records: Math.floor(compared / w), matchShare: Math.round((open.matches / compared) * 1000) / 1000 });
      open = null;
    };
    for (let s = w; s + block <= n; s += block) {
      let m = 0;
      for (let i = s; i < s + block; i++) if (bytes[i] === bytes[i - w]) m++;
      const share = m / block;
      if (share >= lo && share <= hi) {
        if (open && open.end === s) {
          open.end = s + block;
          open.matches += m;
        } else {
          close();
          open = { start: s - w, end: s + block, matches: m };
        }
      } else close();
    }
    close();
  }
  found.sort((a, b) => b.range.end - b.range.start - (a.range.end - a.range.start) || a.width - b.width || a.range.start - b.range.start);
  const out: TableCandidate[] = [];
  for (const c of found) {
    if (out.length >= config.maxGenericCandidates) break;
    if (!out.some((k) => c.range.start < k.range.end && k.range.start < c.range.end)) out.push(c);
  }
  return out.sort((a, b) => a.range.start - b.range.start);
}
