/**
 * FORMAT-AWARE (disclosed). This is the one decoder family the recoverer has: a body of
 * "count byte then value byte" runs and single literal bytes, cut into rows of equal length.
 * The run rule itself lives in ../trial-decode.ts (readToken) and is shared, not copied.
 * It takes a Layout found by the analyzer. It turns bytes into colour indexes and nothing else.
 * It never reads a reference image and holds no sample-specific value.
 */
import { readToken } from '../trial-decode';
import type { ByteRange } from '../types';

export type DecodedRow = {
  /** The row's `stride` colour indexes. */
  indexes: Uint8Array;
  /** Smallest byte range covering every token that produced a value in this row. */
  range: ByteRange;
  /** A run began in an earlier row and continues into this one. */
  runFromAbove: boolean;
  /** A run that ends in this row continues into the next one. */
  runIntoBelow: boolean;
};

export type DecodeOutcome = { ok: true; rows: DecodedRow[] } | { ok: false; reason: string };

/**
 * Decode bytes[bodyStart, bodyEnd) into `height` rows of `stride` values.
 * Fails (never throws) when a run is cut off, when the body gives fewer or more values than height x stride,
 * or when a byte is left over: the body must be used exactly.
 */
export function decodeRunLengthRows(bytes: Uint8Array, bodyStart: number, bodyEnd: number, mask: number, stride: number, height: number): DecodeOutcome {
  const total = stride * height;
  if (!(Number.isInteger(stride) && stride > 0 && Number.isInteger(height) && height > 0)) return { ok: false, reason: 'The row length or height is not a positive whole number.' };
  if (!(bodyStart >= 0 && bodyStart < bodyEnd && bodyEnd <= bytes.length)) return { ok: false, reason: 'The body byte range is empty or outside the file.' };
  const flat = new Uint8Array(total);
  const first = new Array<number>(height).fill(-1);
  const last = new Array<number>(height).fill(-1);
  const fromAbove = new Array<boolean>(height).fill(false);
  const intoBelow = new Array<boolean>(height).fill(false);
  let i = bodyStart;
  let out = 0;
  while (i < bodyEnd) {
    const t = readToken(bytes, i, bodyEnd, mask);
    if (!t) return { ok: false, reason: `A run is cut off or has a zero count at byte ${i}.` };
    if (out + t.count > total) return { ok: false, reason: `The body gives more than the ${total} values that ${height} rows of ${stride} need.` };
    flat.fill(t.value, out, out + t.count);
    const r0 = Math.floor(out / stride);
    const r1 = Math.floor((out + t.count - 1) / stride);
    for (let r = r0; r <= r1; r++) {
      if (first[r]! < 0) first[r] = i;
      last[r] = i + t.length;
    }
    if (r1 > r0) {
      for (let r = r0 + 1; r <= r1; r++) fromAbove[r] = true;
      for (let r = r0; r < r1; r++) intoBelow[r] = true;
    }
    out += t.count;
    i += t.length;
  }
  if (out !== total) return { ok: false, reason: `The body gives ${out} values but ${height} rows of ${stride} need ${total}.` };
  const rows: DecodedRow[] = [];
  for (let r = 0; r < height; r++) {
    rows.push({ indexes: flat.subarray(r * stride, (r + 1) * stride), range: { start: first[r]!, end: last[r]! }, runFromAbove: fromAbove[r]!, runIntoBelow: intoBelow[r]! });
  }
  return { ok: true, rows };
}
