---
inclusion: manual
---
# Roadmap (Part 11): ordered task ladder
One row is one request. Agents: C conductor, E engine-engineer, X experience-designer, V verifier.

## Phase 0: setup and Gate 0 (Thursday, November 26)
Gate 0: the owner decides go or no-go. On no-go the conductor stops and asks: guided recovery (the engine proposes, the user confirms), or switch to Offline Relief Kit (Skeleton Crew).

## Phase 1: engine (Gate 1, Sunday, November 29)
| ID | Task | Agent | Done when |
|---|---|---|---|
| T-01 | Scaffold: Next.js static export, strict TypeScript, lint, Vitest, fast-check, Playwright, the verify script (steps may be stubs), GitHub Actions, README skeleton, .kiro committed | C | `npm run verify` green on a fresh clone; CI green |
| T-02 | Hooks and Provenance Recorder (Parts 9.2, 9.3) | C | An edit by Kiro appears in the ledger; provenance:check runs; verifier confirms |
| T-03 | Corpus: manifest schema, at least 10 legal samples plus one sealed held-out file, reference outputs from a trusted converter, a source and license per sample | E | Manifest validates; hashes match; held-out file excluded from every tuning script |
| T-04 | Spike: one sample end to end, rough, in a spike/ folder deleted afterwards | E | Recovered pixels match the reference for one sample |
| S-01 | Engine spec: EARS requirements, design, task list for analyzer and evidence | C | The owner approves the spec |
| T-05 | Evidence model and its property tests | E | Ranges in bounds, confidence 0 to 1, determinism proven |
| T-06 | Analyzer v1: header and structure detectors, ranked hypotheses with byte ranges | E | Each sample gets ranked hypotheses; golden corpus report exists |

## Phase 2: experience (Gate 2, Tuesday, December 1)
| ID | Task | Agent | Done when |
|---|---|---|---|
| T-07 | Analyzer v2: repetition, run-length, palette and table-like detectors | E | Golden corpus no worse than T-06 |
| S-02 | Recovery and verification spec | C | The owner approves the spec |
| T-08 | Recoverer: hypothesis to content with evidence and self-checks | E | Output matches the reference on every non-held-out sample |
| T-09 | Verifier: comparison, mismatch list, "no reference available" mode | E | Report correct on matching, mismatching and reference-less input |
| T-10 | Robustness: fuzz corrupted, truncated, empty and oversized files, plus a mutation set (altered or removed magic bytes, shifted header offsets) | E | No crash across the fuzz set; unrecovered result with a reason (R-11); on the mutation set every file is recovered exactly or reported unrecovered, never wrong with high confidence |
| T-11 | Regression report and the deliberate-break check (8.3) | V | The break is caught; three consecutive green runs |
| T-12 | Blind test: run the held-out file once, record the result, never tune afterwards | V with the owner | Result recorded in docs/verification/blind-test.md |
| S-03 | Experience spec | C | The owner approves the spec |
| T-13 | Tokens, app shell, layers L0 to L4 as skeletons, 404, 500, empty and loading states | X | Shell renders; states reachable (R-08) |
| T-14 | Hex panel (virtualised) and recovered panel | X | A 1 MB file scrolls smoothly; panels show real engine output |

## Phase 3: polish, proof, ship (Gate 3, Wednesday, December 2, feature freeze)
| ID | Task | Agent | Done when |
|---|---|---|---|
| T-15 | Evidence lines (SVG) and the two-way inspector | X | F-07 passes end to end |
| T-16 | Six-beat choreography, speed control, reduced-motion mode, deterministic demo mode | X | F-01, F-06, F-09 pass |
| T-17 | HUD: Confidence Grid, three SVG charts, verification badge and report, download of the recovered image and the evidence report | X | F-05, F-10 pass |
| T-18 | Honest-failure screen and the corrupt-sample flow | X | F-08 passes |
| T-19 | Full golden-run end-to-end, accessibility and zero-network test; deliberate-break check for the UI | V | R-12 passes on one deployed URL |
| T-20 | Optional Three.js depth field for L0 behind the D-04 gate; if dropped, depth polish against docs/design-target.png | X | Every D-04 condition holds, with the numbers shown, or the task is dropped |
| T-21 | Performance and accessibility pass; docs/security.md self-review; audit clean | C | R-02; budgets enforced in CI |
| T-22 | Deploy: production, staging previews, security headers, rollback tested, known-good tag, uptime monitor URL, optional Cloudflare mirror | C | R-04 to R-07 |
| T-23 | Proof Room and the capture script (stretch) | X | F-13 passes, or the task is cut with a line in the journal |
| T-24 | README judge quick-start (with a short, neutral Related work section naming Kaitai, ImHex, PolyFile and Oscura), privacy note, MIT LICENSE, AUTHORSHIP.md, build journal complete | C | R-09; F-14 |
| T-25 | Fresh-clone test five times and a deployed-URL test from a clean profile | V | 8.3 satisfied; docs/verification/final.md written |
| T-26 | Write-up drafts (the eight Kiro-use questions), blog and social post drafts from the build journal | C | Drafts in docs/submission/ for the owner to edit and publish |

Submit by noon IST on Friday, December 4. Nothing new after Gate 3.
