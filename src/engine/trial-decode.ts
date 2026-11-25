/**
 * FORMAT-AWARE FILE (disclosed). This trial decoder encodes a run rule: a byte whose mask bits are
 * all set is a run marker, its other bits are a count, and the next byte is the repeated value.
 * Any other byte is one literal value. The mask comes from config guesses, not from the bytes.
 * Detectors use it only as a confidence input: "does the body decode using every byte, exactly?"
 * It produces no pixels.
 */
export type TrialResult = { ok: boolean; outputLength: number; steps: number };

/** Decode bytes[start, end) with the given run mask. ok is true only if every byte is used and no run is cut off. */
export function trialDecode(bytes: Uint8Array, start: number, end: number, mask: number): TrialResult {
  const countMask = ~mask & 0xff;
  let i = start;
  let out = 0;
  let steps = 0;
  while (i < end) {
    const b = bytes[i]!;
    steps++;
    if ((b & mask) === mask) {
      const count = b & countMask;
      if (i + 1 >= end || count === 0) return { ok: false, outputLength: out, steps };
      out += count;
      i += 2;
    } else {
      out += 1;
      i += 1;
    }
  }
  return { ok: out > 0, outputLength: out, steps };
}
