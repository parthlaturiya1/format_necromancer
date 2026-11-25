# Recovery and verification spec S-02: tasks

Agent for all: engine-engineer. Tests first. One task per request. Roadmap IDs kept.

- [ ] T-08 Recoverer
  - png.ts decode, checked against all 11 references first
  - decoders/run-length-rows.ts (labelled), recover.ts with self-checks and row Evidence
  - pipeline.ts (analyze -> recover); golden: 11 of 11 exact
  - Requirements: R-R1 to R-R9
- [ ] T-09 Verifier
  - verify.ts with mismatch list and "no reference available" mode; png.ts encode; JSON evidence report
  - Requirements: R-V1 to R-V6
- [ ] T-10 Robustness
  - fuzz set (corrupted, truncated, empty, oversized) and mutation set from tuning samples only
  - Requirements: R-X1 to R-X3; checklist R-11

Out of scope: UI (S-03), blind test (T-12), regression and deliberate-break check (T-11, verifier agent).
Done for this spec: owner approves requirements.md, design.md, tasks.md.
