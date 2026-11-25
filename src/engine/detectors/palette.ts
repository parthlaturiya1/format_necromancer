import type { EngineConfig } from '../config';
import type { ByteRange } from '../types';
import type { WorkMeter } from '../work';

export type PaletteCandidate = { range: ByteRange; entries: number; meanStep: number; distinct: number };

/**
 * Palette detector. For each guessed entry count N, slides a window of N x 3 bytes over the input at
 * every offset (no fixed position). A window is a colour-table candidate when its entries change
 * smoothly (mean absolute step between neighbouring entries, per byte, at most paletteMaxStep)
 * and at least paletteMinDistinct of its entries differ from all others. Fixed-size windows use
 * running sums, so cost is linear in the input size. Windows are kept left to right, none overlapping.
 */
export function detectPalette(bytes: Uint8Array, config: EngineConfig, meter?: WorkMeter): PaletteCandidate[] {
  const n = bytes.length;
  const all: PaletteCandidate[] = [];
  for (const entries of config.paletteEntryCounts) {
    const len = entries * 3;
    if (!Number.isInteger(entries) || entries < 2 || len > n) continue;
    // step[i] = |bytes[i+3] - bytes[i]|; prefix[i] = sum of step[0..i)
    // Charge the prefix pass, the scan, and the worst case of distinctShare (at most maxGenericCandidates x 8 windows of `entries` reads).
    meter?.spend(2 * n + config.maxGenericCandidates * 8 * entries);
    const prefix = new Float64Array(n - 2);
    for (let i = 0; i + 3 < n; i++) prefix[i + 1] = prefix[i]! + Math.abs(bytes[i + 3]! - bytes[i]!);
    // Scan left to right. A window that passes both tests is kept and the scan jumps past it.
    // shortcut: first passing window wins, not the smoothest, to stay linear; upgrade if palettes start to be missed.
    const kept: PaletteCandidate[] = [];
    let checked = 0;
    for (let s = 0; s + len <= n && kept.length < config.maxGenericCandidates && checked < config.maxGenericCandidates * 8; s++) {
      const steps = len - 3; // neighbouring byte pairs inside the window
      const mean = (prefix[s + steps]! - prefix[s]!) / steps;
      if (mean > config.paletteMaxStep) continue;
      checked++;
      const distinct = distinctShare(bytes, s, entries);
      if (distinct < config.paletteMinDistinct) continue;
      kept.push({ range: { start: s, end: s + len }, entries, meanStep: Math.round(mean * 100) / 100, distinct: Math.round(distinct * 1000) / 1000 });
      s += len - 1;
    }
    all.push(...kept);
  }
  // Larger tables first: a long smooth table should be one candidate, not many short ones.
  all.sort((a, b) => b.entries - a.entries || a.meanStep - b.meanStep || a.range.start - b.range.start);
  const out: PaletteCandidate[] = [];
  for (const c of all) {
    if (out.length >= config.maxGenericCandidates) break;
    if (!out.some((k) => c.range.start < k.range.end && k.range.start < c.range.end)) out.push(c);
  }
  return out.sort((a, b) => a.range.start - b.range.start);
}

function distinctShare(bytes: Uint8Array, start: number, entries: number): number {
  const seen = new Set<number>();
  for (let e = 0; e < entries; e++) {
    const o = start + e * 3;
    seen.add(bytes[o]! | (bytes[o + 1]! << 8) | (bytes[o + 2]! << 16));
  }
  return seen.size / entries;
}


