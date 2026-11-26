# Build journal

Format Necromancer was built on one day, 2026-11-25 (all times IST), in Kiro Crew sessions and two tasks in the Kiro IDE. Each block below is one phase, with the commits from `git log --date=iso`. "Credits used" is left blank for the owner to fill in.

## 2026-11-25, 15:31 to 16:06. Setup and Gate 0

- Commits: `540f898` T-00 (steering, custom agents, feature register), `0f93547` T-01 (scaffold), `c3d3f82` T-02 (provenance recorder), `955c6fe` T-03 (corpus), `00a17f9` T-04 (Gate 0 spike).
- Did: wrote the steering files and two custom agents (`engine-engineer`, `verifier`), built the Next.js scaffold with the `npm run verify` gate, made 11 generated PCX samples plus one held-out file with Pillow reference pictures, and ran a small spike to see whether the idea could work at all. The owner then decided Go on Gate 0.
- Credits used:
- Lesson: write the checks first. The corpus and the gate existed before any engine code, so every later task had a pass or fail from the start.
- Kiro surprised us: the provenance hooks (T-02) could not be activated in this Kiro version. We recorded that as it was, and wrote a script (`scripts/provenance/record.mjs`) that appends one ledger line per task instead.

## 2026-11-25, 16:06 to 16:49. Engine

- Commits: `94a098f` S-01 (engine spec), `a27383f` T-05 (evidence model), `ef79114` T-06 (analyzer v1), `988c521` T-07 (analyzer v2), `3fd25e9` S-02 (recovery and verification spec), `88c3471` T-08 (recoverer), `f7f0006` T-09 (verifier), `cbb623b` and `1a448b8` T-10 (robustness), `f3ccc5d` (T-08 fixture change), `c354ac9` S-02 (R-X3 ruling).
- Did: wrote specs in EARS form, then the evidence model, the generic detectors, the recoverer and the verifier. T-10 ran 3,002 fuzz cases (0 crashes, slowest 40 ms) and 297 changed files (0 wrong at confidence 0.9 or more).
- Credits used:
- Lesson: decide what "truth" means before measuring. The R-X3 ruling says a changed file is judged against Pillow's decode of that changed file, so the tests do not reward guessing.
- Kiro surprised us: T-10 hit the first byte of the file, the PCX signature. Pillow refuses a file with a changed signature, so there was no trusted decode. The ruling made a single exception for the 22 first-byte files, which use the source sample as reference. Four generic confidence cuts were added, and 45 files still came out wrong below confidence 0.9 (max 0.85). They are listed in `robustness-report.md`, not hidden.

## 2026-11-25, 16:54 to 17:04. Verification of the engine: regression and blind test

- Commits: `dd7610f` T-11 (regression report), `f614bf8` T-12 (blind test), `de158ae` (held-out guard fix).
- Did: deliberately broke detector settings to see whether the gate noticed (one caught, four not, disclosed in `regression-report.md`). Ran the blind test once on a held-out file: exact, 0 of 13,500 pixels differ.
- Credits used:
- Lesson: a gate that cannot fail proves nothing, so we tried to break it.
- Kiro surprised us: the held-out guard test, added to protect the blind file, turned `verify` red on the very commit that added the blind run (`f614bf8`). The guard did its job. It was fixed in `de158ae` to allow the one-time blind run file.

## 2026-11-25, 17:04 to 19:32. UI

- Commits: `fc6ef15` T-13a (engine worker), `5f734de` S-03 (experience spec), `0bfca09` T-13 (app shell), `a3e2cff` T-14 (panels), `f8bea1a` T-15 (inspector and evidence lines), `4e43ca3` T-16 (ritual and demo mode), `0e3ed35` T-17 (HUD, verification, downloads), `2970013` T-18 (honest failure and signature sample), with reviews `a5c8c26` R-1, `ecedc40` R-2, `0ef297e` R-3, `9f62293` R-4, `41e24ad` R-5.
- Did: built the screen in layers. After each layer a fresh reviewer session looked at screenshots and wrote a design review. T-18 made damaged files end with no picture and a plain reason, never a guess.
- Credits used:
- Lesson: a separate reviewer who has not seen the code catches what the builder stops seeing.
- Kiro surprised us: R-2 saw that the text said "a 128-byte header" while the hex view showed those 128 bytes in grey. Every test passed. The reviewer found it by looking at the screenshot, and it was a UI bug, not an engine bug (`review-t14.md`, N1). R-2 also flagged a big grey "0 mismatches" shown before any check ran, which read like a result.

## 2026-11-25, 18:49 to 20:15. Verification: the whole product

- Commits: `7479c95` T-21a (security self-review, Kiro IDE), `53fda9a` T-11b (detector guard, Kiro IDE), `052e60e` T-19 (golden run), `c3d60be` W-1 (real-world PCX blind run), `2371568` T-21b (engine work limit), `e5819ef` T-21c (real budgets, CI badge, CSP and history scan).
- Did: two tasks in the Kiro IDE (T-11b, a test that fails when the four unguarded detector thresholds change, and T-21a, a security self-review). A verifier session wrote an end-to-end golden run that checks accessibility, console errors and zero network, on the local build and the live site. W-1 ran the engine once on 5 real CC0 files from the game Abuse: 5 of 5 exact against Pillow 13.0.0. T-21c made the size and time budgets real and enforced them in CI.
- Credits used:
- Lesson: ask for proof that the proof works. T-19 broke the UI on purpose and the golden run failed as it should, then the break was deleted.
- Kiro surprised us: in T-19 a planted UI break (the evidence line never shown) was caught by the golden run on the first try. In W-1 the first launch crashed on a byte-order mark in the manifest before the engine ran on any file, and the report says so.

## 2026-11-25, 20:15 to 20:50. Large files, polish, review and deploy

- Commits: `137f1f4` T-21d (work limit scales with file size), `1c7a77b` T-20 (depth polish and real game-art samples), `160cb87` latest verify result, `7aee359` J-2 (judge-panel review), `558947a` T-22 (deploy checks, rollback plan).
- Did: T-21b set one fixed work limit for every file. T-21d replaced it with 60,000,000 steps plus 36 steps per byte, and made three detectors cheaper with identical answers (60 of 60 equal on a comparison test). A valid 10.4 MB file is now exact in 1,591 ms. The J-2 judge review listed the README doubts that P-2 fixes.
- Credits used:
- Lesson: a safety limit can be a bug. A limit made to stop attacks also stopped real, valid files.
- Kiro surprised us: the conductor tried bigger valid files than the task had, and found the fixed limit refused valid files above about 0.5 to 1 MB with "Stopped: the file needs more work than the safety limit allows". The original tests did not cover that size. That finding became T-21d.

## 2026-11-25. Docs

- Commits: `568812e` T-24a (licence, README, privacy, authorship), `367960d` J-1 (judge-panel gap review), `5ff4859` (owner confirms review-only AI apps, IDE hook-check notes), `8bea62c` T-24b (README matches the app), `6efddfb` (AUTHORSHIP lists Codex, Claude, Gemini as planning and review only), and P-2 (README first screen, fixes, this journal).
- Did: wrote the README, the privacy note and the authorship page, then checked each README claim against a report (`t24b-readme-check.md`). The judge reviews J-1 and J-2 pointed at gaps. P-2 moved the proof to the first screen.
- Credits used:
- Lesson: every number in the README must come from a report in the repo. A stale number (the provenance warning count) is worse than none, so the README now points to `latest.md`.
- Kiro surprised us: the J-2 reviewer found the README contradicted itself (it called the budget step a stub while the results table said budgets were enforced). Our own docs had drifted after T-21c.

## Hook check lines (2026-11-25, Kiro IDE)

Hook test
Hook test 2
