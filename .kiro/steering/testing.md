---
inclusion: always
---
# Testing and verification (Part 8) and feature register IDs

## 8.1 One gate: `npm run verify`, in order, stops at first red
1. Typecheck. 2. Lint. 3. Unit tests.
4. Property tests: evidence stays in bounds; files made with the reference tool are recovered exactly; corrupted and truncated input never crashes; same input gives same output.
5. Golden corpus regression with a per-sample report. 6. Build.
7. Playwright e2e: smoke, golden run, honest failure, reduced motion, accessibility with axe, console free of errors, no requests to other origins and none at all during analysis.
8. Budgets: engine timing, bundle size, Lighthouse CI once configured.
9. Security: `npm audit` failing on high or critical, plus a secret scan.
10. `provenance:check`.
Writes docs/verification/latest.md: PASS or FAIL per step, plus the feature register.

## 8.2 Task loop (every task)
1. Read the Task Card. 2. Write or adjust tests first. 3. Implement. 4. Run targeted tests. 5. Run verify once.
6. On failure: root cause in three lines, fix only that, rerun. At most three loops, then stop and ask.
7. Verifier reviews the diff and docs/verification/latest.md independently, returns PASS or FAIL with evidence, naming anything untested.
8. Verifier updates docs/feature-register.md; conductor updates the build journal.
9. Commit `T-xx: summary`. A task is done only at verifier PASS.

## 8.3 Repetition
- Gate 1: three consecutive green verify runs.
- Gate 3 (feature freeze): five consecutive green runs on a fresh clone using only the README, plus smoke test of the deployed URL from a clean browser profile at laptop and phone sizes.
- A flaky test is a bug. Fix it; never add retries.
- Test the tests: Gate 1, verifier makes one deliberate break on a throwaway branch (e.g. change a detector threshold) and confirms the golden corpus catches it. Gate 2, same for the UI (remove one evidence line), confirm an e2e test fails.

## 8.4 Ship-readiness checklist (verifier confirms every line at Gate 3)
- R-01 CI green on main (T-01). R-02 No high or critical audit findings (T-21). R-03 Secret scan clean (T-01).
- R-04 Security headers live on deployed URL (T-22). R-05 Preview deploy works as staging, known-good tag exists (T-22).
- R-06 Rollback tested once (T-22). R-07 External uptime monitor running; owner sets up, Kiro supplies URL (T-22).
- R-08 Real 404, 500, empty, loading states (T-13). R-09 Privacy note and LICENSE present (T-24).
- R-10 README judge quick-start; fresh clone passes (T-24, T-25). R-11 Hostile-file fuzzing passes (T-10). R-12 Accessibility checks pass (T-19).
Do not build auth, rate limiting, billing, database backups, email, accounts, password reset, pen tests, compliance audits or runtime AI safeguards. If a task seems to need them, scope has drifted: stop and ask.

## Done means
Strict TS no errors, lint clean, unit and property tests green, golden corpus no worse, e2e and accessibility green, budgets held, verifier PASS, feature register and build journal updated, commit made.

## Feature register IDs (tracked in docs/feature-register.md)
F-01 Resurrect bundled sample (deterministic demo). F-02 Drop in file (up to 10 MB, larger refused, no upload). F-03 Ranked hypotheses. F-04 Evidence on every element. F-05 Verification report and downloads. F-06 Six-beat ritual, speed 0.5x to 4x. F-07 Two-way inspector. F-08 Honest failure. F-09 Reduced-motion mode. F-10 Confidence dot grid and charts. F-11 Blind-test result. F-12 Real states (404, 500, empty, loading). F-13 Proof Room (stretch). F-14 Judge quick-start.
