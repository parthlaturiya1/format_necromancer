import type { EngineConfig } from '../config';
import { decodedLengths } from '../trial-decode';
import type { WorkMeter } from '../work';

export type HeaderCandidate = {
  headerLength: number;
  tailLength: number;
  runMarkerMask: number;
  /** Length of the decoded body, in values. */
  bodyOutputLength: number;
};

/**
 * Header-block detector. Finds (header size, end-table size, run mask) triples where the bytes between
 * header and table decode using every byte. Pure: no state.
 * T-21d: for each run mask the body is read ONCE (decodedLengths) and answers every header size and every
 * end-table size from that one walk, instead of one full trial decode per triple. Results and their order are
 * the same as before. Tokens read are charged to the shared work meter.
 */
export function detectHeaderBlocks(bytes: Uint8Array, config: EngineConfig, meter?: WorkMeter): HeaderCandidate[] {
  const n = bytes.length;
  const ends = config.tailSizes.map((t) => Math.max(0, n - t));
  const starts = [...new Set(config.headerSizes)].sort((a, b) => a - b);
  // A start at or past an end gives length 0 or -1 for that end, which is never a candidate (len > 0 is required).
  const walkable = starts.filter((s) => s < Math.max(...ends));
  const lengths = new Map<number, Int32Array>();
  if (walkable.length > 0) {
    const cum = new Int32Array(n + 1);
    for (const mask of config.runMarkerMasks) {
      meter?.spend(1);
      lengths.set(mask, decodedLengths(bytes, walkable, ends, mask, config.maxOutputValues, cum, (s) => meter?.spend(s)));
    }
  }
  const found: HeaderCandidate[] = [];
  for (const headerLength of config.headerSizes) {
    const si = walkable.indexOf(headerLength);
    if (si < 0) continue; // header at or past an end: never a candidate
    config.tailSizes.forEach((tailLength, ti) => {
      for (const runMarkerMask of config.runMarkerMasks) {
        const len = lengths.get(runMarkerMask)?.[si * ends.length + ti] ?? -1;
        if (len > 0) found.push({ headerLength, tailLength, runMarkerMask, bodyOutputLength: len });
      }
    });
  }
  return found;
}
