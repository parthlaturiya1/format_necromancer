import type { EngineConfig } from '../config';
import { trialDecode } from '../trial-decode';

export type HeaderCandidate = {
  headerLength: number;
  tailLength: number;
  runMarkerMask: number;
  /** Length of the decoded body, in values. */
  bodyOutputLength: number;
};

/**
 * Header-block detector. Finds (header size, end-table size, run mask) triples where the bytes between
 * header and table decode using every byte. Pure: no state. Stops when the work budget is spent.
 */
export function detectHeaderBlocks(bytes: Uint8Array, config: EngineConfig): HeaderCandidate[] {
  const found: HeaderCandidate[] = [];
  let work = 0;
  for (const headerLength of config.headerSizes) {
    for (const tailLength of config.tailSizes) {
      const end = bytes.length - tailLength;
      if (headerLength >= end) continue;
      for (const runMarkerMask of config.runMarkerMasks) {
        if (work > config.workBudget) return found;
        const r = trialDecode(bytes, headerLength, end, runMarkerMask);
        work += r.steps + 1;
        if (r.ok) found.push({ headerLength, tailLength, runMarkerMask, bodyOutputLength: r.outputLength });
      }
    }
  }
  return found;
}
