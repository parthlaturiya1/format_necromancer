# Feature register
Maintained by the verifier. Updated at T-19 (HEAD 8bea62c, local build out/). PASS means a test I ran in T-19 passed; evidence in docs/verification/t19-golden-run.md. Full e2e run: 45 passed, 5 skipped (SHOTS-only), 0 failed, plus 5 golden-run tests.

| ID | Feature | Done when | Status |
|---|---|---|---|
| F-01 | Resurrect a bundled sample (deterministic demo mode) | One click runs the real engine on a bundled sample and plays all six beats | PASS: golden-run.spec.ts (beats 1..6 in order, 10.65 s beat 1 to 6 at 1x, local and live); ritual.spec.ts demo mode plays the same twice. |
| F-02 | Drop in a file | Files up to 10 MB accepted, larger refused with a clear message, nothing uploaded | PASS: panels.spec.ts (file read and analysed, over 10 MB refused); t18.spec.ts user file noise.bin; 0 foreign requests in every run. Not tested: a real 10 MB file end to end (1 MB tested for DOM size). |
| F-03 | Ranked hypotheses | Each recognisable sample gets at least one hypothesis with byte ranges | PASS: engine golden 11 of 11 (golden-report.md) and UI beat 3 cards (ritual.spec.ts "each beat shows its own content"). Held-out file ranked in the UI: blind run in golden-run.spec.ts exact. |
| F-04 | Evidence on every element | Property test: ranges in bounds, confidence 0 to 1, no element without evidence | PASS: property tests (verify step 4) and UI: golden-run.spec.ts click row shows rule, confidence, lit bytes; inspector.spec.ts. |
| F-05 | Verification report | Exact or not, with a mismatch list; a "no reference available" mode; recovered image and evidence report downloadable | PASS: hud.spec.ts (exact, mutated Not exact with count, user file "No reference available", PNG round-trips, JSON parses); golden-run.spec.ts exact, 0 mismatches. |
| F-06 | Six-beat ritual | All beats play in order; speed control 0.5x to 4x | PASS: golden-run.spec.ts; ritual.spec.ts (4x about a quarter of 1x, speed pill). 0.5x and 2x not run in a test. |
| F-07 | Two-way inspector | Click a region to light its bytes, click bytes to select their region; rule and confidence shown | PASS: inspector.spec.ts (both directions, keyboard, line follows scroll); golden-run.spec.ts. Phone has no line by design (highlight only). |
| F-08 | Honest failure | A corrupted sample ends as unrecovered with a plain-words reason, no crash | PASS: golden-run.spec.ts and t18.spec.ts (failure red, reason in words, no picture, page still usable); engine fuzz 3002 cases 0 crashes (robustness-report.md). |
| F-09 | Reduced-motion mode | Same information, no animation | PASS: golden-run.spec.ts reduced runs match full-motion values (badge, pixels differ, grid, canvas, failure reason); ritual.spec.ts 0 animations. |
| F-10 | Confidence dot grid and charts | One dot per recovered row or region; hand-built SVG charts | PASS for the grid: 111 dots for 111 rows (golden-run.spec.ts); charts in hud.spec.ts. Amber (uncertain) dots only checked in t18.spec.ts changed-lower-confidence, not in the golden sample (0 uncertain rows there). |
| F-11 | Blind-test result | The held-out file result is shown and labelled | PASS: golden-run.spec.ts loads it from the button: "Blind test" badge, "Held-out file, never used for tuning.", exact, 0 of 13,500 pixels differ, local and live. One file, same generator as tuning set. |
| F-12 | Real states | 404, 500, empty and loading states | PASS: shell.spec.ts (loading, 404, 500 reachable; axe clean on 404); empty state is the idle page in golden-run.spec.ts step 1. |
| F-13 | Proof Room (stretch) | /proof renders the ledger and captures, read-only, offline | NOT BUILT: build output has only / and /_not-found (route list from npm run build). |
| F-14 | Judge quick-start | README opens with the URL, a 30-second try, where .kiro is, how Kiro was used | PARTIAL: the 5 try steps work on live and local (golden-run.spec.ts runs them). One wording mismatch (step 5, see t19-golden-run.md). Fresh-clone run (R-10) not done by me. |

## T-25 update (HEAD 8445a58, 2026-11-26, verifier)
Evidence: five consecutive fresh-clone verify greens (runs 2 to 6) and a live check, both in docs/verification/final.md. Live screenshots: docs/verification/screens/t25-live-desktop.png and t25-live-phone.png.

| ID | T-25 status | Evidence |
|---|---|---|
| F-01 | PASS | Live golden run, 1440x900 and 390x844, full and reduced motion: 5 of 5 passed, beats 1..6, press to done 7.3 s (full) and 1.2 to 1.5 s (reduced). Fresh clone e2e green x5. |
| F-02 | PASS (same limit as T-19) | Fresh clone e2e green x5 (panels.spec.ts, t18.spec.ts). 10 MB real file still not run end to end. |
| F-03 | PASS | Golden 11 of 11 in verify step 5, x5 green. Live: grid_dots 200, rows rebuilt 200 of 200. |
| F-04 | PASS | Property tests (step 4) green x5. Live: row click shows rule, confidence, lit bytes (golden run). |
| F-05 | PASS | Live: badge "Exact match", "0 of 64,000 pixels differ". |
| F-06 | PASS | Live golden run beats 1..6; speed pill shows 2x then reaches 1x (p1.spec.ts live). 0.5x and 4x not run live. |
| F-07 | PASS | Live golden run row selected, axe clean. Phone: highlight only, by design. |
| F-08 | PASS | Live t18.spec.ts: corrupted sample ends red with reason; phone failure screen fits. |
| F-09 | PASS | Live reduced-motion runs match full-motion values; 3 s to 1.2 s faster. |
| F-10 | PASS | Live grid 200 dots, 0 uncertain on the default sample. Amber only tested in t18 changed-file test. |
| F-11 | PASS | Live blind test: "0 of 13,500 pixels differ". |
| F-12 | PASS | Live /nope returns HTTP 404; shell.spec.ts green x5. |
| F-13 | NOT BUILT | Unchanged. |
| F-14 | PARTIAL | README quick-start steps work on live. Fresh-clone "Run locally" works, with the defects listed in final.md. |
