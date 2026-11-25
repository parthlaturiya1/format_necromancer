import type { EngineConfig } from '../config';
import type { WorkMeter } from '../work';

export type RunPairCandidate = {
  /** How many top bits, all set, were treated as a marker. */
  prefixBits: number;
  /** Marker bytes that are followed by a non-marker byte. */
  pairs: number;
  /** Share of all markers that are followed by a non-marker byte. */
  followShare: number;
  /** Share of all bytes that are markers. */
  markerShare: number;
  /** pairs * 2 / length: how much of the input the pairs would cover. */
  score: number;
};

/**
 * Run-length detector. Independent of the guessed run masks: for each marker width p (top p bits
 * all set), it measures how often a marker byte is followed by a plain byte, as in "count, value" pairs.
 * Random bytes fail the follow share (about 1 - 2^-p); real count-value data mostly passes because markers are rarely followed by markers.
 * Returns one candidate per width that has enough pairs, a high follow share and markers on less than half of the bytes.
 */
export function detectRunPairs(bytes: Uint8Array, config: EngineConfig, meter?: WorkMeter): RunPairCandidate[] {
  const out: RunPairCandidate[] = [];
  const n = bytes.length;
  meter?.spend(n * config.runPrefixBits.length);
  if (n === 0) return out;
  for (const p of config.runPrefixBits) {
    if (!Number.isInteger(p) || p < 1 || p > 7) continue;
    const mask = (0xff << (8 - p)) & 0xff;
    let markers = 0;
    let pairs = 0;
    for (let i = 0; i < n; i++) {
      if ((bytes[i]! & mask) !== mask) continue;
      markers++;
      if (i + 1 < n && (bytes[i + 1]! & mask) !== mask) pairs++;
    }
    if (markers === 0) continue;
    const followShare = pairs / markers;
    const markerShare = markers / n;
    if (pairs >= config.runMinPairs && followShare >= config.runMinFollowShare && markerShare < 0.5) {
      out.push({ prefixBits: p, pairs, followShare: Math.round(followShare * 1000) / 1000, markerShare: Math.round(markerShare * 1000) / 1000, score: Math.round(((pairs * 2) / n) * 1000) / 1000 });
    }
  }
  return out;
}

