import type { Recovered } from './recover';

export type Mismatch = { row: number; col: number; expected: [number, number, number]; actual: [number, number, number] };
export type Reference = { width: number; height: number; rgb: Uint8Array };
export type VerificationReport =
  | { mode: 'reference'; exact: boolean; mismatchCount: number; mismatches: Mismatch[]; reason?: string }
  | { mode: 'no-reference'; note: 'no reference available' };

/** The mismatch list is cut at this many entries; mismatchCount always holds the true total (R-V1). */
export const MAX_MISMATCHES = 1000;

/**
 * Compare a recovered picture with a reference the caller passes in (R-V6). Pure: no I/O, no network (R-V5).
 * With no reference it never claims the picture is right (R-V3).
 */
export function verify(recovered: Recovered, reference: Reference | null): VerificationReport {
  if (reference === null) return { mode: 'no-reference', note: 'no reference available' };
  if (recovered.status !== 'ok') {
    return { mode: 'reference', exact: false, mismatchCount: 0, mismatches: [], reason: `No picture was recovered, so there is nothing to compare. ${recovered.reason}` };
  }
  if (recovered.width !== reference.width || recovered.height !== reference.height) {
    return {
      mode: 'reference',
      exact: false,
      mismatchCount: 0,
      mismatches: [],
      reason: `The recovered picture is ${recovered.width} by ${recovered.height} but the reference is ${reference.width} by ${reference.height}, so pixels were not compared.`,
    };
  }
  const a = recovered.rgb;
  const b = reference.rgb;
  const mismatches: Mismatch[] = [];
  let count = 0;
  for (let p = 0; p < recovered.width * recovered.height; p++) {
    const o = p * 3;
    if (a[o] === b[o] && a[o + 1] === b[o + 1] && a[o + 2] === b[o + 2]) continue;
    count++;
    if (mismatches.length < MAX_MISMATCHES) {
      mismatches.push({ row: Math.floor(p / recovered.width), col: p % recovered.width, expected: [b[o]!, b[o + 1]!, b[o + 2]!], actual: [a[o]!, a[o + 1]!, a[o + 2]!] });
    }
  }
  return { mode: 'reference', exact: count === 0, mismatchCount: count, mismatches };
}
