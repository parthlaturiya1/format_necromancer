# Engine spec S-01: requirements (analyzer and evidence)

Scope: analyzer v1/v2 and the evidence model (T-05 to T-07). Recoverer and verifier are S-02. Source: steering product.md, tech.md; spike result docs/verification/gate0-spike.md.

## Terms
- Input: the bytes of one file, up to 10 MB (D-11).
- Hypothesis: a guessed layout, with supporting byte ranges and a confidence.
- Evidence: the record in tech.md (elementId, byteRanges, rule, confidence, hypothesisId).
- Tuning set: non-held-out corpus samples. The held-out file is never used to tune.

## Requirements (EARS)
R-A1. When the analyzer receives a byte array, the analyzer shall return a ranked list of hypotheses, best first, in under 3 seconds for a 1 MB input in a worker (D-10).
R-A2. The analyzer shall return the same output for the same input every time. It shall use no clock, no randomness and no network.
R-A3. Each hypothesis shall carry an id, a rank, a confidence from 0 to 1, and the byte ranges that support it.
R-A4. When a hypothesis loses, the analyzer shall record a plain-words reason it lost.
R-A5. The analyzer shall contain no format names and no specification constants. Detectors shall be generic: header-block, repeated-structure, run-length, palette-table, table-like.
R-A6. Where a search list is needed (for example run-marker masks, header sizes), the list shall live in one named config object, labelled as a guess, so it can be disclosed.
R-A7. When the input is empty, shorter than 16 bytes, truncated, corrupted or over 10 MB, the analyzer shall return an unrecovered result with a plain-words reason and shall not throw.
R-A8. Each detector shall be a pure function: bytes in, candidates out, with no shared mutable state.
R-A9. The analyzer shall never read the held-out file. A test shall fail if any tuning code reads corpus/heldout.
R-A10. When two hypotheses tie, the analyzer shall break the tie by a documented rule, and the rule shall be listed in design.md.

## Evidence requirements
R-E1. Every recovered element shall have exactly one Evidence record.
R-E2. For every Evidence record, each byte range shall satisfy 0 <= start < end <= file length (start inclusive, end exclusive).
R-E3. For every Evidence record, confidence shall be a finite number from 0 to 1.
R-E4. For every Evidence record, the rule shall be a non-empty plain-words string and hypothesisId shall name a hypothesis in the same result.
R-E5. The system shall not output any element without Evidence. A failed or unexplained region shall be output with low confidence or the status unexplained, never omitted silently.
R-E6. Evidence ordering and ids shall be deterministic.

## Acceptance (maps to roadmap)
- T-05: R-E1 to R-E6 proven by property tests (fast-check); determinism proven.
- T-06: each tuning sample gets ranked hypotheses; a golden-corpus report exists.
- T-07: golden corpus no worse than T-06.

## Known limits (be honest in docs)
- The Gate 0 spike scored 11 of 11 on tuning samples, but tie-break rules were tuned on them. It is not a blind score.
- All samples come from one generator. T-10 adds altered-header and corrupted sets.
- The decoder is format-aware and labelled (S-02).
