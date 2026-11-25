/**
 * Search lists for the analyzer (R-A6). EVERY value here is a GUESS chosen by the engineer
 * from general knowledge of how binary image files tend to look. None was discovered from the
 * bytes. They are listed in one place so they can be disclosed and changed.
 * This file and trial-decode.ts are the only places in the engine allowed to hold such constants.
 */
export type EngineConfig = {
  /** GUESS: header sizes to try, in bytes. */
  headerSizes: ReadonlyArray<number>;
  /** GUESS: sizes of a colour-table block at the end of the file, in bytes (0 means none). */
  tailSizes: ReadonlyArray<number>;
  /** GUESS: run-marker bit masks. A byte with all mask bits set starts a run; the other bits are the count. */
  runMarkerMasks: ReadonlyArray<number>;
  /** GUESS: how many leading bytes to search for four size numbers. */
  boxScanLimit: number;
  /** GUESS: largest believable width or height. */
  maxDimension: number;
  /** GUESS: largest believable extra bytes per row beyond the width. */
  maxStridePad: number;
  /** Cap on size-number candidates kept (work limit). */
  maxBoxCandidates: number;
  /** Cap on hypotheses returned (work limit). */
  maxHypotheses: number;
  /** Cap on trial-decode steps per analysis, so a 1 MB input stays fast and the result stays deterministic. */
  workBudget: number;
  /** Inputs shorter than this are refused (R-A7). */
  minInputBytes: number;
  /** Inputs longer than this are refused (R-A7, D-11). */
  maxInputBytes: number;
};

export const defaultConfig: EngineConfig = {
  headerSizes: [0, 16, 32, 64, 128, 256, 512],
  tailSizes: [0, 768, 769],
  runMarkerMasks: [0xc0, 0x80, 0xe0],
  boxScanLimit: 128,
  maxDimension: 8192,
  maxStridePad: 4,
  maxBoxCandidates: 64,
  maxHypotheses: 12,
  workBudget: 40_000_000,
  minInputBytes: 16,
  maxInputBytes: 10 * 1024 * 1024,
};
