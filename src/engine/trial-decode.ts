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

/**
 * Decoding the same body from several start offsets re-reads almost the same tokens, because a token stream
 * falls back into step after a few bytes (T-21d). So the first start is walked once, and every other start is
 * walked only until it lands on a token boundary of that first walk; the rest is read off the first walk.
 * Result: res[si * ends.length + ei] is the decoded length of bytes[starts[si], ends[ei]), or -1 when it does not
 * decode exactly (a run is cut off, a count is zero, the end is not a token boundary, or the total passes maxOutput).
 * Same run rule as readToken and trialDecode (tests/engine/large-files.test.ts compares the two).
 * starts[0] must be the smallest start; every start must be below every end. `cum` needs bytes.length + 1 entries and is overwritten.
 * `spend` gets the number of tokens read, after each walk.
 * shortcut: a start that never lands on the first walk (two-byte runs shifted by one byte) is walked to the end,
 * one walk per start; the work meter bounds it. Upgrade if such inputs show up as slow.
 */
export function decodedLengths(bytes: Uint8Array, starts: ReadonlyArray<number>, ends: ReadonlyArray<number>, mask: number, maxOutput: number, cum: Int32Array, spend?: (steps: number) => void): Int32Array {
  const res = new Int32Array(starts.length * ends.length).fill(-1);
  const limit = Math.max(...ends);
  const countMask = ~mask & 0xff;
  cum.fill(-1);
  // First walk: record the output length at every token boundary it reaches (never past maxOutput).
  let i = starts[0]!;
  let out = 0;
  let tokens = 0;
  for (;;) {
    cum[i] = out;
    if (i >= limit) break;
    const b = bytes[i]!;
    let count = 1;
    let len = 1;
    if ((b & mask) === mask) {
      count = b & countMask;
      if (i + 1 >= limit || count === 0) break;
      len = 2;
    }
    if (out + count > maxOutput) break;
    out += count;
    i += len;
    tokens++;
  }
  spend?.(tokens + 1);
  for (let ei = 0; ei < ends.length; ei++) res[ei] = cum[ends[ei]!]!;
  for (let si = 1; si < starts.length; si++) {
    let p = starts[si]!;
    let o = 0;
    let steps = 0;
    for (;;) {
      if (cum[p]! >= 0) {
        for (let ei = 0; ei < ends.length; ei++) {
          const e = ends[ei]!;
          const total = o + cum[e]! - cum[p]!;
          if (e >= p && cum[e]! >= 0 && total <= maxOutput) res[si * ends.length + ei] = total;
        }
        break;
      }
      for (let ei = 0; ei < ends.length; ei++) if (p === ends[ei]) res[si * ends.length + ei] = o;
      if (p >= limit) break;
      const b = bytes[p]!;
      let count = 1;
      let len = 1;
      if ((b & mask) === mask) {
        count = b & countMask;
        if (p + 1 >= limit || count === 0) break;
        len = 2;
      }
      if (o + count > maxOutput) break;
      o += count;
      p += len;
      steps++;
    }
    spend?.(steps + 1);
  }
  return res;
}

/** Decode bytes[start, end) with the given run mask. ok is true only if every byte is used and no run is cut off. */
/** With maxOutput, stops as not ok once the output passes it, so a crafted body cannot chain counts into a huge total. */
export function trialDecode(bytes: Uint8Array, start: number, end: number, mask: number, maxOutput = Infinity): TrialResult {
  let i = start;
  let out = 0;
  let steps = 0;
  while (i < end) {
    steps++;
    const t = readToken(bytes, i, end, mask);
    if (!t) return { ok: false, outputLength: out, steps };
    out += t.count;
    if (out > maxOutput) return { ok: false, outputLength: out, steps };
    i += t.length;
  }
  return { ok: out > 0, outputLength: out, steps };
}
