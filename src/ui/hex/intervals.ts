import type { ByteRange } from '../../engine/types';

/** 2 = explained, 1 = uncertain, 0 = unexplained. */
export type ByteState = 0 | 1 | 2;
export type Segment = { start: number; end: number; state: ByteState };

/**
 * Merge evidence ranges once into sorted, non-overlapping segments (R-U8).
 * Where ranges overlap, the best state wins: a byte that any rule explains counts as explained.
 * Bytes no range covers are not in the index; callers read them as unexplained.
 */
export function buildIndex(items: ReadonlyArray<{ range: ByteRange; state: ByteState }>): Segment[] {
  const pts: { at: number; state: ByteState; d: 1 | -1 }[] = [];
  for (const { range, state } of items) {
    if (range.end > range.start) {
      pts.push({ at: range.start, state, d: 1 }, { at: range.end, state, d: -1 });
    }
  }
  pts.sort((a, b) => a.at - b.at);
  const count = [0, 0, 0];
  const out: Segment[] = [];
  let i = 0;
  while (i < pts.length) {
    const at = pts[i]!.at;
    while (i < pts.length && pts[i]!.at === at) {
      count[pts[i]!.state]! += pts[i]!.d;
      i++;
    }
    const next = pts[i]?.at;
    if (next === undefined) break;
    const state = count[2]! > 0 ? 2 : count[1]! > 0 ? 1 : count[0]! > 0 ? 0 : -1;
    if (state < 0) continue;
    const last = out[out.length - 1];
    if (last && last.end === at && last.state === state) last.end = next;
    else out.push({ start: at, end: next, state: state as ByteState });
  }
  return out;
}

/** Index of the first segment whose end is above `offset`, by binary search. */
export function firstSegment(index: ReadonlyArray<Segment>, offset: number): number {
  let lo = 0;
  let hi = index.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (index[mid]!.end <= offset) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** States for bytes [start, end), 0 where nothing covers the byte. One binary search, then a walk. */
export function statesFor(index: ReadonlyArray<Segment>, start: number, end: number): ByteState[] {
  const out: ByteState[] = new Array<ByteState>(end - start).fill(0);
  for (let s = firstSegment(index, start); s < index.length && index[s]!.start < end; s++) {
    const seg = index[s]!;
    for (let o = Math.max(seg.start, start); o < Math.min(seg.end, end); o++) out[o - start] = seg.state;
  }
  return out;
}
