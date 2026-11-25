# Engine spec S-01: tasks

Agent for all: engine-engineer. Tests first. One task per request. Roadmap IDs kept.

- [ ] T-05 Evidence model and property tests
  - types.ts, evidence.ts with validateEvidence
  - fast-check: ranges in bounds, confidence 0 to 1, determinism
  - Requirements: R-E1 to R-E6, R-A2
- [ ] T-06 Analyzer v1: header and structure detectors
  - config.ts, header-block, box-numbers, row-stride detectors, analyze.ts, input guard
  - Golden corpus report per tuning sample (rank, confidence, reason losers lost)
  - Requirements: R-A1 to R-A5, R-A7 to R-A10
- [ ] T-07 Analyzer v2: repetition, run-length, palette, table-like detectors
  - Golden corpus no worse than T-06
  - Requirements: R-A1, R-A5, R-A6, R-A8

Out of scope here: recoverer and verifier (S-02), robustness fuzzing (T-10), blind test (T-12).
Done for this spec: owner approves requirements.md, design.md, tasks.md.
