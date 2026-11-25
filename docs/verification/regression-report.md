# Regression report (T-11)

Verifier session. I wrote none of the engine code. Base: `main` at 1a448b8 (T-10: robustness). The brief named c354ac9; that commit is an ancestor, and 1a448b8 is the real HEAD I tested. Node v26.13.1, run with `npm.cmd run verify`, one run after another.

## 1. Three consecutive runs

All three: **PASS, exit 0**. Times in seconds. Start times are local (IST).

| Step | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Start | 16:50:02 | 16:51:04 | 16:51:54 |
| 1 Typecheck | PASS 7.8 | PASS 5.0 | PASS 6.1 |
| 2 Lint | PASS 13.5 | PASS 8.6 | PASS 13.2 |
| 3 Unit tests | PASS 4.4 | PASS 2.9 | PASS 4.3 |
| 4 Property tests | PASS 12.1 | PASS 8.3 | PASS 8.2 |
| 5 Golden corpus | PASS 4.0 | PASS 3.2 | PASS 3.8 |
| 6 Build | PASS 10.3 | PASS 10.8 | PASS 12.8 |
| 7 Playwright e2e | PASS 4.7 | PASS 5.2 | PASS 4.1 |
| 8 Budgets | PASS (stub) | PASS (stub) | PASS (stub) |
| 9a Audit | PASS 2.2 | PASS 3.2 | PASS 3.0 |
| 9b Secret scan | PASS 0.4 | PASS 0.5 | PASS 0.2 |
| 10 provenance:check | PASS 0.3 | PASS 0.6 | PASS 0.4 |
| Overall | PASS | PASS | PASS |

`golden-report.md` and the other report files did not change between runs (git status showed only `latest.md` modified). The engine output is stable across runs.

## 2. Deliberate break (testing.md 8.3)

Branch `break/t11-threshold` (throwaway, never committed, deleted).

**Break that was caught:** `maxDimension` in `src/engine/config.ts`, `8192` to `8`. No box can be larger than 8, so the size numbers of every sample are rejected.

Golden step alone (`vitest run` on the five golden test files):

```
FAIL  tests/engine/golden-report.test.ts > writes the golden report and rank 1 matches the spike on every tuning sample
AssertionError: expected 1 to be 11 // Object.is equality
FAIL  tests/engine/golden-v2.test.ts > rank 1 is no worse than T-06 on every tuning sample; writes the v2 report
AssertionError: expected [ …(20) ] to deeply equal []
Test Files  2 failed (2)
```

Full verify with the break:

```
| 4 Property tests | PASS (8.9s) |
| 5 Golden corpus | FAIL (exit 1) |
| 6 Build ... 10 provenance:check | SKIPPED |
verify: FAIL. Wrote docs/verification/latest.md
```

So the gate stops at step 5 and exits 1. The break is caught.

**Breaks that were NOT caught (untested thresholds).** Each was run alone against the five golden/mutation test files. All 5 files passed (26 tests):

| Threshold | Old | New | Result |
|---|---|---|---|
| `paletteMaxStep` | 24 | 0 | NOT caught |
| `runMinFollowShare` | 0.9 | 1.01 | NOT caught |
| `runMinPairs` | 8 | 100000 | NOT caught |
| `tableMinRecords` | 8 | 100000 | NOT caught |

Reason, from `golden-v2-report`: the generic detectors (palette, run-pairs, table-records) add supporting evidence only and do not change rank or confidence (the report says so). The test checks rank 1 only. A detector can stop working and the gate stays green. With `maxDimension` = 8 the report text showed "table-records 0" and evidence counts dropping by one per sample, but no test asserts those counts. This is a real gap: **detector thresholds other than the size-number ones are unguarded.** I did not add a test (the brief allowed one if a gap needs it; I judged that an assertion on detector firing counts is the owner's decision, since the engine author said those counts are tuned guesses).

After the break I restored `src/`, switched to `main`, deleted the branch. `git status`: only `docs/verification/latest.md` (run 3 output) modified, plus this report and the register. HEAD at start and before my commit: 1a448b8.

## 3. Untested or weak (things I saw)

- Step 8 Budgets is a STUB. It prints STUB and passes. No engine timing, bundle size or Lighthouse check exists.
- Step 7 Playwright e2e passes in about 4 s. There is no UI yet, so it cannot test any ritual or inspector.
- Browser deflate (PNG download in a real browser) was not exercised. `png.test.ts` runs in Node only.
- Hooks (`.kiro/hooks/provenance.json`) need the Kiro IDE. Not tested by me.
- Provenance check prints 536 UNATTRIBUTED warnings (see `latest.md`). Warning only, it never fails the gate.
- The held-out file was not read by me.
- The tuning samples share one generator, so green runs say little about real unknown files.
- CI has not run (not pushed).

## 4. Gate 1 scorecard (testing.md PART 13F)

The UI does not exist. Scores reflect what I can see today.

| Criterion | Score | Evidence |
|---|---|---|
| Potential Impact | 6 | A tool to rebuild images from unknown formats is a clear idea, but only one synthetic format is shown. |
| Technological Implementation | 7 | 3 green verify runs, 3002 fuzz cases with 0 crashes, 297 mutations with 0 confident-wrong. But 4 of 5 tried thresholds are unguarded. |
| Design | 2 | No UI exists. Nothing to judge. |
| Innovation | 7 | Evidence on every element, a provenance ledger and a mutation rule check are uncommon. |
| Presentation | 3 | Reports are clear. No README quick-start check, no demo, no UI. |

**Three weakest points**

1. No UI. Design and Presentation cannot be scored higher until one exists (F-01, F-06, F-07 unverified).
2. Detector thresholds are unguarded: 4 of 5 breaks stayed green. The gate checks rank 1 only.
3. Evidence base is narrow: one generator, 11 tuning samples, one held-out file, Budgets stub, no CI run.
