import type { EngineConfig } from '../config';
import type { WorkMeter } from '../work';

export type BoxCandidate = { offset: number; width: number; height: number };

const u16 = (b: Uint8Array, o: number) => b[o]! | (b[o + 1]! << 8);

/**
 * Box-numbers detector. Looks near the start for four consecutive 16-bit numbers (little-endian)
 * a, b, c, d with c >= a and d >= b, read as a box: width c-a+1, height d-b+1.
 * Whether a box is real is decided later, by whether it fits the decoded body.
 */
export function detectBoxNumbers(bytes: Uint8Array, config: EngineConfig, meter?: WorkMeter): BoxCandidate[] {
  const out: BoxCandidate[] = [];
  meter?.spend(config.boxScanLimit + 1);
  const last = Math.min(bytes.length - 8, config.boxScanLimit);
  for (let o = 0; o <= last && out.length < config.maxBoxCandidates; o++) {
    const a = u16(bytes, o);
    const b = u16(bytes, o + 2);
    const c = u16(bytes, o + 4);
    const d = u16(bytes, o + 6);
    if (c < a || d < b) continue;
    const width = c - a + 1;
    const height = d - b + 1;
    if (width > config.maxDimension || height > config.maxDimension || width * height < 2) continue;
    out.push({ offset: o, width, height });
  }
  return out;
}
