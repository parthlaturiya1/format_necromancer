# Engine spec S-01: design

## Layout (engine-engineer writes only these)
- `src/engine/types.ts`: Evidence, Hypothesis, AnalysisResult, ByteRange.
- `src/engine/evidence.ts`: constructors and a `validateEvidence(e, fileLength)` check.
- `src/engine/config.ts`: the labelled guess lists (R-A6).
- `src/engine/detectors/`: one file per detector (header-block, box-numbers, row-stride, run-length, palette-tail, repeat, table-like). Each is `(bytes, config) => Candidate[]`.
- `src/engine/analyze.ts`: runs detectors, combines candidates into hypotheses, ranks, records losers.
- `src/engine/worker.ts`: thin Web Worker wrapper (UI work comes later).
- Tests: `tests/engine/`, `tests/property/`.

## Types
```ts
type ByteRange = { start: number; end: number };           // end exclusive
type Evidence = { elementId: string; byteRanges: ReadonlyArray<ByteRange>;
                  rule: string; confidence: number; hypothesisId: string };
type Hypothesis = { id: string; rank: number; confidence: number;
                    ranges: ReadonlyArray<ByteRange>; layout: Layout;
                    lostBecause?: string };
type AnalysisResult =
  | { status: 'ok'; hypotheses: Hypothesis[]; evidence: Evidence[] }
  | { status: 'unrecovered'; reason: string };
```
`Layout` is generic: header length, box numbers, row stride, run-marker mask, table tail offset and length. It carries no format name.

## Method (from the Gate 0 spike, kept generic)
1. Header-block: find the smallest boundary after which the body decodes using every byte.
2. Box and stride: find small integers near the start that make a width, a height and a row stride.
3. Run-length: trial-decode with marker masks from config; keep layouts that use every body byte exactly.
4. Palette tail: test for a block of N x 3 bytes at the end that fits the body.
5. Score: confidence rises with bytes explained and with exact-length fit. Rank by confidence, then the documented tie-break (R-A10).

## Tie-break rule (R-A10)
Prefer the larger decoded area, then a round header size. The spike tuned this on the tuning set, so T-06 must report it as tuned, not blind.

## Determinism and safety
- No Date, no Math.random, no I/O. Sort with stable comparators.
- Input guard first: length 0, < 16, > 10 MB gives `unrecovered` with a reason (R-A7). Wrap detectors so a thrown error becomes `unrecovered`, never a crash.
- Detector cost is bounded: a work budget per detector so a 1 MB input stays under 3 s.

## Tests
- Unit: each detector on small hand-made byte arrays.
- Property (fast-check): ranges in bounds (R-E2); confidence in [0,1] (R-E3); same input gives same output (R-A2); random, truncated and empty bytes never throw (R-A7).
- Golden: per-sample report of rank 1 layout and confidence on the tuning set only.
- Guard: grep test that nothing but the validator touches corpus/heldout (exists from T-03).

## Risks
- Search lists are guesses (disclose in config.ts and README).
- Overfit to one generator. Mitigation: T-10 mutation set, T-12 blind test.
