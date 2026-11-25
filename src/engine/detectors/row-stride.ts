import type { EngineConfig } from '../config';
import type { BoxCandidate } from './box-numbers';
import type { HeaderCandidate } from './header-block';

export type StrideCandidate = {
  rowStride: number;
  /** Offset of a 16-bit header number equal to the stride, or -1 when the stride is only derived. */
  numberOffset: number;
};

/**
 * Row-stride detector. For one header guess and one box guess: the decoded length must split into
 * `height` equal rows, each at least `width` long and at most maxStridePad longer.
 * Returns null when it does not fit. Where the same number sits in the header, its offset is reported.
 */
export function detectRowStride(bytes: Uint8Array, config: EngineConfig, header: HeaderCandidate, box: BoxCandidate): StrideCandidate | null {
  const len = header.bodyOutputLength;
  if (len % box.height !== 0) return null;
  const rowStride = len / box.height;
  if (rowStride < box.width || rowStride > box.width + config.maxStridePad) return null;
  let numberOffset = -1;
  for (let o = 0; o + 2 <= header.headerLength; o++) {
    if (o + 2 > box.offset && o < box.offset + 8) continue;
    if ((bytes[o]! | (bytes[o + 1]! << 8)) === rowStride) {
      numberOffset = o;
      break;
    }
  }
  return { rowStride, numberOffset };
}
