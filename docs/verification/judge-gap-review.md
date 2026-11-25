# J-1: Judge-panel gap review

Reviewer: judge-panel reviewer. I wrote none of this project. Report only, no code touched.
Read: steering product/roadmap/demo, feature-register, regression-report, t17-hud, review-t16, README, AUTHORSHIP listing, build-journal, security.md, .kiro tree, hooks JSON, corpus and public/samples listings, `screens/t17-done.png`. Live site answered HTTP 200 (I did not compare it to main).
Not read in full: tech.md, testing.md, design.md, the specs' text, review-t13/t14/t15, blind-test.md, robustness-report.md, `design-target.png`, other screens. Scores that lean on them are marked "(thin)".
Work tree at review time: T-17 files modified and uncommitted; `npm run verify` red at step 3 per `t17-hud.md` (held-out guard test lists `scripts/samples/copy-samples.mjs`).

## 0. Facts that cap the scores

| Fact | Where | Effect |
|---|---|---|
| One format (PCX), one generator for 11 tuning samples plus 1 held-out | regression-report 3, feature-register F-11 | Impact and Innovation ceiling. A judge asks "does it work on a real file?" |
| README is a skeleton: "Judge quick-start TODO (T-24)" | `README.md` | Presentation and Geethanjali/Dustin entry point is empty today |
| `docs/build-journal.md` holds "Hook test / Hook test 2" and nothing else | `docs/build-journal.md` | The "Kiro surprise moment" has no home |
| Hooks stay "(disabled)" in the IDE; `.kiro/hooks/new.json` is a leftover test hook | `.kiro/hooks/` | A judge opening the hooks panel sees disabled and a junk file |
| Ledger has 22 lines; verify prints hundreds of UNATTRIBUTED warnings | ledger.jsonl, latest.md | Provenance claim is weaker than the story |
| Budgets step is a stub; no CI run on GitHub yet (as of T-11) | regression-report 3 | "Rigour" claims have a visible hole |
| Beat 5 frame rate p95 15 to 20 fps in headless run | t17-hud | The reveal is the differentiator. Unproven on a real GPU |
| 4 of 5 detector thresholds unguarded by tests | regression-report 2 | Testing story has a known gap |
| Feature register: most UI items UNVERIFIED | feature-register.md | No independent UI verdict yet (T-19) |
| No demo video, no write-up yet | roadmap T-26, owner | Presentation is capped until they exist |

## 1. Potential Impact

(a) Score now: **6**. Evidence: real audience (archives, museums; product.md) and a clear promise; the UI shows exact match, 0 of 12,321 pixels differ (`t17-hud.md`). But the audience claim is unsourced (product.md forbids invented numbers, so no number exists), and the only proof is synthetic PCX made by our own generator (regression-report 3, F-11). PCX is also not obviously "a dead format nobody can open": Pillow and many viewers open it. A judge can say so in one sentence.

(b) A 10 here: a judge drops in a file they did not see, from a real source, and it works or fails honestly. One sourced sentence on who loses data to dead formats. A visitor can use it in 30 seconds without help, on a phone.

(c) Gap: no real-world file; the "dead format" story is weak for PCX; no sourced need; phone layout only partly done (review-t16 F9).

(d) Actions:
1. Frame the PCX story honestly: PCX is a stand-in for formats with no spec at hand; the test is "without the specification". Put one line in README and UI notice. Effort S. Task: T-24.
2. Add 2 to 3 real, legally usable PCX files (public domain or CC0, source and licence in `corpus/manifest.json`) as bundled samples and record the result, good or bad. This is allowed: not a new format, not tuning against held-out. Do it before Gate 2 only if no engine edit follows; if the engine fails on them, show the failure honestly. Effort M. Task: new (T-19 may host as a verifier run, no engine tuning).
3. One cited source for the problem (a library or archive report on obsolete formats). Write the link in README, no statistic unless the source states it. Effort S. Task: T-24 / T-26.
4. Phone pass: title wrap, 4-group hex, hide empty cards. Effort M. Task: T-17 follow-up or T-21.
5. Honest-failure screen done well (F-08) because it is the trust signal for a real user. Effort M. Task: T-18.

## 2. Technological Implementation

(a) Score now: **7**. Evidence: 3 specs, 7 steering files, 2 custom agents, hooks JSON (`.kiro/`); verify gate of 11 steps green 3 times (regression-report 1); 3002 fuzz cases, 0 crashes; 297 mutations, 0 confident-wrong (T-10 history); blind test exact on the held-out file (F-11); separate verifier session that broke the engine on purpose (regression-report 2); R-1 to R-4 design reviews; signed commits. Minus: hooks disabled and a junk hook; ledger thin; Budgets stub; unguarded thresholds; verify red at the moment; no CI run seen; "variety of Kiro tools" shows CLI + one IDE task only, no MCP use visible in the repo (thin).

(b) A 10: every Kiro surface used has a visible artefact a judge can open in 2 minutes: specs with tasks ticked, steering that visibly changed an outcome, custom agents with scoped write rules, at least one hook that fires live on camera, a ledger that matches git history, green CI badge, budgets enforced, and one honest "Kiro surprised us" story.

(c) Gap: hooks never shown firing; ledger vs. git mismatch; Budgets stub; CI not proven; verify red; no surprise story written.

(d) Actions:
1. Turn verify green: decide the held-out guard allow-list for `copy-samples.mjs` in its own commit (guardrail 7, not weakening: say why). Effort S. Task: T-17 close, owner decision.
2. Make Budgets real (bundle size 250 KB gzipped, engine time, phone page height already measured) and run CI on GitHub; show the badge. Effort M. Task: T-21 / T-22.
3. Fix the hook story: delete `new.json` test hook, keep provenance.json, and film the fallback: if IDE hooks stay "(disabled)", show the same recorder firing from the Kiro CLI task and say plainly hooks are disabled in the IDE build used. Do not claim hooks fire if they did not. Effort S. Task: T-24 / video.
4. Add detector-count assertions so the 4 unguarded thresholds fail the gate (verifier's own recommendation). Effort S to M. Task: new (verifier, tests only).
5. Write the "Kiro surprise" and "lesson" lines into build-journal now, from real events (e.g. the held-out guard turning verify red; the T-10 fixture change; the verifier finding 4 undetected breaks). Effort S. Task: T-24 / T-26.

## 3. Design

(a) Score now: **7**. Evidence: `screens/t17-done.png` shows a coherent dark mint UI, six-step timeline, bytes, picture, grid, charts, verification, downloads, credit line; axe 0 violations, 0 console errors, 0 other-origin requests, 35 of 35 e2e (`t17-hud.md`); reduced-motion and keyboard exist. Minus: review-t16 open items (F6 line tracks scan, F7 small picture in tall panel, F8 grid shape, F9 phone); the done screen has lots of empty space under the picture and a very small footer; T-18 failure screen not built; one flaky e2e; frame rate not proven.

(b) A 10: the picture fills its panel at every size; the evidence line never crosses text; the failure screen is as designed as the success screen; phone is a first-class layout; motion holds 55 fps on a normal laptop; the design matches `design-target.png` where it can and states where it does not.

(c) Gap: failure state; phone; picture scale; motion proof on real hardware; design-target match not yet judged by me (thin).

(d) Actions:
1. Honest-failure screen and corrupted-sample flow, designed to the same level (demo 2:05). Effort M. Task: T-18.
2. Scale the picture to the largest whole multiple that fits (review-t16 F7). Effort S. Task: T-17 follow-up or T-20.
3. Phone pass (title wrap, grouped hex, hidden empty cards). Effort M. Task: T-21.
4. Bisect the beat-5 fps drop (glow on 111 dots, solid panel fill), measure on a real laptop and phone, record numbers. Effort M. Task: T-21 / T-19.
5. Line follows the scan row (F6) and grid column shape (F8). Effort S each. Task: T-20 depth polish, only if the Three.js gate is dropped.

## 4. Innovation

(a) Score now: **7**. Evidence: the claim "recovered without the specification" with generic detectors carrying no format names (product.md); evidence per element with byte ranges and confidence; two-way inspector; mutation rule (altered magic bytes); never claims more than it does. Against Kaitai WebIDE, ImHex, PolyFile: those need a human-written pattern or a known signature; this infers layout from samples. That is a real difference, but not yet verified in the README (guardrail 12: do not claim another tool cannot do something unverified).

(b) A 10: a judge sees something no listed tool does, on a file they trust, and a related-work table that is accurate and cited. Ideally two format families or one non-image output so it is not "a PCX decoder".

(c) Gap: one family; decoder is format-aware per hypothesis (disclosed, but a sharp judge will say "so it is a PCX decoder with a detector in front"); no side-by-side with Kaitai/ImHex/PolyFile.

(d) Actions:
1. Related work section: what each tool does, from their own docs, with links; state our difference as "starts from bytes, no spec supplied" and only that. Effort S. Task: T-24.
2. Make the mutation demo visible: a bundled file with altered magic bytes that still recovers, labelled. Corpus already has mutations. Effort S to M. Task: T-18 or T-19 (UI picks an existing mutation file; no engine change).
3. Say the limits on screen: "format-aware decoder for this hypothesis family" next to the result. Effort S. Task: T-17 follow-up.
4. A second format is cut before Gate 2 (guardrail 9): do not do it. A second PCX variant (other bit depth) already in the corpus counts; check. Effort S. Task: T-19 note.
5. One slide or README paragraph on "evidence per element" as the idea, with the inspector screenshot. Effort S. Task: T-24 / video.

## 5. Presentation

(a) Score now: **3**. Evidence: README is a skeleton with TODO; build-journal is test text; no video; no write-up; `docs/submission/` absent; AUTHORSHIP.md exists. The live URL answers 200. The demo contract exists (demo.md E) and is good.

(b) A 10: a 3-minute video that follows demo.md E to the second, captions on, no music issue, opening on the unopenable file and ending with `.kiro` on screen; a README whose first screen has the URL, a 30-second try, where `.kiro` lives, and how Kiro was used; a write-up answering the Kiro-use questions with real commits.

(c) Gap: all of it. This is the largest gap and the cheapest to close.

(d) Actions:
1. README judge quick-start: URL, 3 steps, expected result, `.kiro` map, privacy note, MIT LICENSE, authorship line exactly as product.md. Effort S. Task: T-24.
2. Build journal: real entries per day, including the surprise moment and credits used. Effort S. Task: T-24.
3. Write the video script from demo.md E with exact on-screen text and which sample to use; run it twice as a dry run on the deployed URL with the default sample. Effort M. Task: video (owner) plus T-26.
4. Write-up drafts (eight Kiro-use questions) from the ledger and git log. Effort M. Task: T-26.
5. Short GIF or screenshot strip in README (ritual beats, inspector, failure). Effort S. Task: T-24 (use the existing `screens/`).

## 6. Top 10 across criteria, ranked by points per hour

Estimates are my judgement, not measured. "Pts" is the rise in one criterion's score, summed over criteria.

| Rank | Action | Pts | Effort | Task |
|---|---|---|---|---|
| 1 | README quick-start, privacy note, LICENSE, authorship, `.kiro` map | +2 Presentation, +0.5 Tech | S | T-24 |
| 2 | Build journal with real entries and the surprise moment | +1 Presentation, +0.5 Tech | S | T-24 |
| 3 | Make verify green (held-out guard decision in its own commit) | +0.5 Tech, unblocks all | S | T-17 close |
| 4 | Related work section with cited, neutral claims | +1 Innovation, +0.5 Presentation | S | T-24 |
| 5 | Honest-failure screen and corrupted flow | +1 Design, +0.5 Impact | M | T-18 |
| 6 | Hooks story: remove `new.json`, show recorder firing, state "disabled" plainly | +0.5 Tech, +0.5 Presentation | S | T-24 / video |
| 7 | Video script and two dry runs on the deployed URL | +2 Presentation | M | video, T-26 |
| 8 | Real-world PCX samples (sourced, licensed) run without tuning, result shown honestly | +1 Impact, +0.5 Innovation | M | new via T-19 |
| 9 | Real Budgets step and CI green badge | +1 Tech | M | T-21, T-22 |
| 10 | Detector-count tests for the 4 unguarded thresholds | +0.5 Tech | S to M | new (verifier) |

Next after these: phone pass, picture scale, fps bisect, write-up drafts.

## 7. Where 10 is not reachable honestly

- **Impact:** one format, one real-ish audience, no usage evidence, no sourced numbers. 8 is the honest ceiling by Dec 2. A 10 needs several real files and real archive users.
- **Innovation:** a decoder per hypothesis family is disclosed as format-aware. With one family, the novelty is the process and evidence, not generality. 8 is the ceiling. Do not claim more.
- **Tech:** IDE hooks are disabled and cannot be activated, so the hook surface stays partly unproven. 9 is the ceiling unless they fire.
- **Design:** 9 is possible. 10 needs real-device motion proof that I cannot confirm from here.
- **Presentation:** 9 to 10 depends on the owner's video, which Kiro does not record (demo.md E).

## 8. Biggest single risk to every score

The reveal runs at 15 to 20 fps p95 in the one measurement taken after T-17 (`t17-hud.md`), and it is the differentiator. If a judge's laptop shows the same, Design and Innovation both drop. Measure on real hardware before Gate 3.
