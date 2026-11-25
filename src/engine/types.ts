/** Half-open byte range: start inclusive, end exclusive. */
export type ByteRange = { start: number; end: number };

export type Evidence = {
  elementId: string;
  byteRanges: ReadonlyArray<ByteRange>;
  rule: string;
  confidence: number;
  hypothesisId: string;
};

/** Generic layout facts. No format names. Fields are optional: a detector fills only what it found. */
export type Layout = {
  headerLength?: number;
  boxNumbers?: ReadonlyArray<number>;
  rowStride?: number;
  runMarkerMask?: number;
  tableTailOffset?: number;
  tableTailLength?: number;
};

export type Hypothesis = {
  id: string;
  rank: number;
  confidence: number;
  ranges: ReadonlyArray<ByteRange>;
  layout: Layout;
  lostBecause?: string;
};

export type AnalysisResult =
  | { status: 'ok'; hypotheses: Hypothesis[]; evidence: Evidence[] }
  | { status: 'unrecovered'; reason: string };
