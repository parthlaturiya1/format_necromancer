/**
 * FORMAT-AWARE FILE (disclosed). This trial decoder encodes a run rule: a byte whose mask bits are
 * all set is a run marker, its other bits are a count, and the next byte is the repeated value.
 * Any other byte is one literal value. The mask comes from config guesses, not from the bytes.
 * Detectors use it only as a confidence input: "does the body decode using every byte, exactly?"
 * It produces no pixels. The recoverer's decoder reads tokens through readToken, so the run rule lives here only.
 */
export type TrialResult = { ok: boolean; outputLength: number; steps: number };

/** One token of the run rule: `count` copies of `value`, taking `length` bytes (1 for a literal, 2 for a run). */
export type Token = { length: number; count: number; value: number };

/** Read the token at bytes[i] (i < end). Returns null when a run is cut off at `end` or has a count of zero. */
export function readToken(bytes: Uint8Array, i: number, end: number, mask: number): Token | null {
  const b = bytes[i]!;
  if ((b & mask) === mask) {
    const count = b & (~mask & 0xff);
    if (i + 1 >= end || count === 0) return null;
    return { length: 2, count, value: bytes[i + 1]! };
  }
  return { length: 1, count: 1, value: b };
}

/** Decode bytes[start, end) with the given run mask. ok is true only if every byte is used and no run is cut off. */
export function trialDecode(bytes: Uint8Array, start: number, end: number, mask: number): TrialResult {
  let i = start;
  let out = 0;
  let steps = 0;
  while (i < end) {
    steps++;
    const t = readToken(bytes, i, end, mask);
    if (!t) return { ok: false, outputLength: out, steps };
    out += t.count;
    i += t.length;
  }
  return { ok: out > 0, outputLength: out, steps };
}
