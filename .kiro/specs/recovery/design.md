# Recovery and verification spec S-02: design

## Layout (engine-engineer writes only these)
- `src/engine/decoders/run-length-rows.ts`: FORMAT-AWARE (disclosed). Bytes + Layout in, rows of colour indexes out, with the body byte range for each row.
- `src/engine/recover.ts`: picks rank-1, calls the decoder, applies the colour table, runs self-checks, builds row Evidence.
- `src/engine/verify.ts`: compares with a reference pixel buffer, builds the report.
- `src/engine/png.ts`: tiny PNG encode (for download) and decode (for references), no dependency. Uses the browser's `CompressionStream`/`DecompressionStream` in the app and Node zlib in tests, behind one small interface.
- `src/engine/pipeline.ts`: analyze -> recover -> verify, the one call the worker and UI use.
- Tests: `tests/engine/`, `tests/property/`, `tests/engine/mutations/`.

## Types
```ts
type RecoveredRow = { index: number; evidenceId: string; status: 'ok' | 'uncertain' | 'unexplained' };
type Recovered =
  | { status: 'ok'; width: number; height: number; rgb: Uint8Array;
      rows: RecoveredRow[]; evidence: Evidence[]; hypothesisId: string; confidence: number }
  | { status: 'unrecovered'; reason: string };
type Mismatch = { row: number; col: number; expected: [number, number, number]; actual: [number, number, number] };
type VerificationReport =
  | { mode: 'reference'; exact: boolean; mismatchCount: number; mismatches: Mismatch[]; reason?: string }
  | { mode: 'no-reference'; note: 'no reference available' };
```

## Confidence per row
Start from the hypothesis confidence. Lower it for each failed self-check (R-R5): uncertain below 0.9, unexplained below 0.5. The weights live in `config.ts`, labelled as guesses. Row status drives the Confidence Grid colour (accent, amber, dim, red).

## Pipeline order
1. Input guard (10 MB, empty, short).
2. analyze (S-01).
3. recover (no reference in scope).
4. Only then load the reference, if one is bundled, and verify.
Every step catches its own errors and returns unrecovered with a reason.

## Downloads (F-05)
- Recovered image: PNG made by `png.ts`.
- Evidence report: JSON with the hypothesis list, row evidence and verification report. No file bytes inside it, only ranges.

## Mutation set (T-10)
Built by a script from tuning samples only, written to `corpus/mutations/` with a manifest. Kinds: magic byte changed, magic byte zeroed, header shifted by 1 to 4 bytes, tail cut by 1 to 768 bytes, 1 to 8 body bytes flipped, empty file, 10 MB + 1 file made in memory (not stored). Expected outcome per file: "exact" or "unrecovered". A test fails on "recovered, not exact, confidence >= 0.9".

## Tests
- Unit: decoder on hand-made rows; each self-check; verifier on equal, one-pixel-off, size-off, no-reference.
- Property (fast-check, fixed seed): recover never throws; every row has exactly one Evidence and ranges stay in bounds; same input gives the same output.
- Golden: 11 of 11 exact against reference, reported in docs/verification/golden-report.md (extend the existing report).
- Guard: the existing held-out scan still passes; verify.ts never imports corpus paths.

## Risks
- PNG decode of references must match Pillow's output byte for byte; test it on all 11 references first.
- Weights for row confidence are guesses; disclose them.
