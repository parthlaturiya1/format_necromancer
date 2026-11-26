# C-2: CI verify failure on 9b79721, public failure annotations

## What CI showed (read without sign-in, GitHub REST API)

| Run | Commit | Result | `npm run verify` time |
|---|---|---|---|
| 45653958103 | 8858128 | success | 4m10s |
| 45664134160 | 8445a58 (F-1) | failure | 3m14s |
| 45806565513 | 9b79721 (C-1) | failure | 4m21s |

The only annotation was "Process completed with exit code 1". Job logs and the artifact zip return 403 without a sign-in.

## Cause (reproduced locally, not proven on CI)

`tests/e2e/golden-run.spec.ts:150`, "golden run 1440x900 full motion":

```
Error: expect(received).toBeGreaterThan(expected)
Expected: > 0
Received:   0
> 150 | expect(await page.locator('.hex-bytes .b.sel').count()).toBeGreaterThan(0);
```

The test clicks row 7, waits for the inspector card, then counts the lit hex bytes once. The count does not wait. On a slow machine the hex panel has not drawn the selection yet, so the count is 0.

How it was reproduced: `CI=true`, the whole e2e suite pinned to 2 CPU cores (Windows process affinity 0x3, the core count of a GitHub runner). Result: 69 passed, 1 failed (the line above). With all cores, `CI=true` verify passed. This is likely the same one-off failure C-1 saw at 4x throttle and could not capture.

The CI log is still unread, so it is unproven that CI failed on this exact line. The run time fits: CI stopped at 4m21s, about the full length of a green run, so the failure was late in the run (e2e), not in typecheck, lint or build.

## Fix

Ten one-shot checks of the form `expect(await page.locator(X).count()).toBeGreaterThan(0)` became `await expect(page.locator(X)).not.toHaveCount(0)`. Playwright re-checks this until it passes or its 5 s timeout ends. The test still needs the same thing on screen. No limit was raised, no test retry was added, no `src/**` file changed.

Files: `tests/e2e/golden-run.spec.ts` (1), `hud.spec.ts` (2), `inspector.spec.ts` (3), `panels.spec.ts` (1), `ritual.spec.ts` (1), `t18.spec.ts` (2).

## Failures readable without sign-in

- `scripts/verify.mjs` keeps each step's output. When a step fails it prints `::error title=verify step <name>::<reason>`. The reason is the first four failure-looking lines, at most 600 chars. GitHub shows this as a public annotation on the run page.
- When `GITHUB_STEP_SUMMARY` is set, verify writes the step table to it. On a red step it also writes the failed step and its last 40 output lines. The workflow needs no change for this.
- `playwright.config.ts`: on CI the `github` reporter is added. Each failed test becomes its own annotation with the file and line.
- Checked offline: the reason extractor run over the failing local log gives `::error title=verify step 7 Playwright e2e::1) tests\e2e\golden-run.spec.ts:63:5 › golden run 1440x900 full motion ... | Error: expect(received).toBeGreaterThan(expected) | ...`.

## Results (Node v26.13.1, Windows)

| Run | Result | e2e |
|---|---|---|
| Before fix, `CI=true`, e2e on 2 cores | FAIL | 69 passed, 1 failed, 24 skipped, 5.8 min |
| After fix, `CI=true`, full verify on 2 cores | PASS, all 12 steps | 71 passed, 23 skipped, 6.0 min |
| After fix, no `CI`, full verify, all cores | PASS, all 12 steps | 71 passed, 5.5 min; perf medians 7 849 ms (bar 9 000), 0 ms (bar 50) |

## Not verified

- CI itself (not pushed). The owner pushes, then the run page shows PASS or a readable annotation.
- Node 22 and Linux. Software rendering on the runner.
- That golden-run line 150 was the real CI failure. If CI is still red, the new annotation names the step and the line.
- Only one 2-core run before and after the fix, so a rarer race could remain.
