# Verification

Overall: **PASS**
Run: 2026-11-25T10:11:15.961Z, Node v26.13.1

| Step | Result |
|---|---|
| 1 Typecheck | PASS (2.3s) |
| 2 Lint | PASS (2.6s) |
| 3 Unit tests | PASS (0.8s) |
| 4 Property tests | PASS (0.7s) |
| 5 Golden corpus | PASS (stub, 0.0s) |
| 6 Build | PASS (5.3s) |
| 7 Playwright e2e | PASS (25.2s) |
| 8 Budgets | PASS (stub, 0.0s) |
| 9a Audit (high/critical) | PASS (1.6s) |
| 9b Secret scan | PASS (0.1s) |
| 10 provenance:check | PASS (stub, 0.0s) |

## Feature register

# Feature register
Maintained by the verifier. Every status starts UNVERIFIED.

| ID | Feature | Done when | Status |
|---|---|---|---|
| F-01 | Resurrect a bundled sample (deterministic demo mode) | One click runs the real engine on a bundled sample and plays all six beats | UNVERIFIED |
| F-02 | Drop in a file | Files up to 10 MB accepted, larger refused with a clear message, nothing uploaded | UNVERIFIED |
| F-03 | Ranked hypotheses | Each recognisable sample gets at least one hypothesis with byte ranges | UNVERIFIED |
| F-04 | Evidence on every element | Property test: ranges in bounds, confidence 0 to 1, no element without evidence | UNVERIFIED |
| F-05 | Verification report | Exact or not, with a mismatch list; a "no reference available" mode; recovered image and evidence report downloadable | UNVERIFIED |
| F-06 | Six-beat ritual | All beats play in order; speed control 0.5x to 4x | UNVERIFIED |
| F-07 | Two-way inspector | Click a region to light its bytes, click bytes to select their region; rule and confidence shown | UNVERIFIED |
| F-08 | Honest failure | A corrupted sample ends as unrecovered with a plain-words reason, no crash | UNVERIFIED |
| F-09 | Reduced-motion mode | Same information, no animation | UNVERIFIED |
| F-10 | Confidence dot grid and charts | One dot per recovered row or region; hand-built SVG charts | UNVERIFIED |
| F-11 | Blind-test result | The held-out file result is shown and labelled | UNVERIFIED |
| F-12 | Real states | 404, 500, empty and loading states | UNVERIFIED |
| F-13 | Proof Room (stretch) | /proof renders the ledger and captures, read-only, offline | UNVERIFIED |
| F-14 | Judge quick-start | README opens with the URL, a 30-second try, where .kiro is, how Kiro was used | UNVERIFIED |

