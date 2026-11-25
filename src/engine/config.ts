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
  /** GUESS: shortest run of one repeated byte worth reporting, in bytes. */
  repeatMinRun: number;
  /** GUESS: sizes of a repeated fixed-size structure to try, in bytes. */
  repeatStructSizes: ReadonlyArray<number>;
  /** GUESS: fewest back-to-back identical copies of a structure worth reporting. */
  repeatMinCopies: number;
  /** GUESS: how many top bits of a byte, all set, make it look like a run-pair marker (the bit patterns are built from this number, not listed). */
  runPrefixBits: ReadonlyArray<number>;
  /** GUESS: fewest marker-then-value pairs before the run-pair score means anything. */
  runMinPairs: number;
  /** GUESS: smallest share of markers that must be followed by a non-marker byte. */
  runMinFollowShare: number;
  /** GUESS: colour-table entry counts to try (each entry is 3 bytes). */
  paletteEntryCounts: ReadonlyArray<number>;
  /** GUESS: largest mean step between neighbouring entries, per byte, for a table to count as smooth. */
  paletteMaxStep: number;
  /** GUESS: smallest share of entries that must differ from every other entry. */
  paletteMinDistinct: number;
  /** GUESS: record widths to try for fixed-width record regions, in bytes. */
  tableRecordWidths: ReadonlyArray<number>;
  /** GUESS: fewest records in a region. */
  tableMinRecords: number;
  /** GUESS: share of bytes equal to the byte one record earlier that makes a region record-like (lower bound, upper bound; above the upper bound it is plain repetition). */
  tableMatchShare: readonly [number, number];
  /** Cap on candidates kept per generic detector (work limit). */
  maxGenericCandidates: number;
  /** Cap on size-number candidates kept (work limit). */
  maxBoxCandidates: number;
  /** Cap on hypotheses returned (work limit). */
  maxHypotheses: number;
  /** Cap on trial-decode steps per analysis, so a 1 MB input stays fast and the result stays deterministic. */
  workBudget: number;
  /** GUESS (recoverer): confidence taken off a row for each neighbouring row that shares a run with it. */
  rowRunCrossPenalty: number;
  /** GUESS (recoverer): confidence taken off every row when the layout has no colour table, so each index is shown as a grey level. */
  noTablePenalty: number;
  /** GUESS (recoverer, T-10): confidence taken off every row when the end table has no lone lead byte before its whole entries (length divides by 3): nothing marks where the table starts, so a table cut or moved by one byte would look the same. */
  tableNoLeadPenalty: number;
  /** GUESS (recoverer, T-10): confidence taken off every row when the row length is 2 or more bytes longer than the width: those extra columns are unexplained. */
  widePadPenalty: number;
  /** GUESS (recoverer, T-10): confidence taken off every row when the hypothesis lacks a supporting fact (its confidence is below 1), so such a row is never shown as ok. */
  partialSupportPenalty: number;
  /** GUESS (recoverer): a row below this confidence is shown as uncertain. */
  uncertainBelow: number;
  /** GUESS (recoverer): a row below this confidence is shown as unexplained. */
  unexplainedBelow: number;
  /** Cap on decoded values (stride x height), a work limit so one input cannot ask for gigabytes. */
  maxOutputValues: number;
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
  repeatMinRun: 16,
  repeatStructSizes: [2, 3, 4, 6, 8, 12, 16, 32],
  repeatMinCopies: 4,
  runPrefixBits: [1, 2, 3],
  runMinPairs: 8,
  runMinFollowShare: 0.9,
  paletteEntryCounts: [16, 64, 128, 256],
  paletteMaxStep: 24,
  paletteMinDistinct: 0.9,
  tableRecordWidths: [2, 3, 4, 6, 8, 12, 16, 24, 32],
  tableMinRecords: 8,
  tableMatchShare: [0.25, 0.9],
  maxGenericCandidates: 16,
  maxBoxCandidates: 64,
  maxHypotheses: 12,
  workBudget: 40_000_000,
  rowRunCrossPenalty: 0.15,
  noTablePenalty: 0.2,
  tableNoLeadPenalty: 0.2,
  widePadPenalty: 0.2,
  partialSupportPenalty: 0.1,
  uncertainBelow: 0.9,
  unexplainedBelow: 0.5,
  maxOutputValues: 16 * 1024 * 1024,
  minInputBytes: 16,
  maxInputBytes: 10 * 1024 * 1024,
};

