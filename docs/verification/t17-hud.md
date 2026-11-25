# T-17 HUD: Confidence Grid, charts, verification, downloads, blind-test label

Agent: experience-designer. Base: `4e43ca3`. Committed as "T-17: HUD, verification, downloads".
Headless Chromium, 1440x900 and 390x844, Playwright one worker, built static export (`out/`).

## Result in numbers
| Check | Result |
|---|---|
| New spec `tests/e2e/hud.spec.ts` | 9 of 9 pass |
| Whole e2e suite | 35 of 35 in `npm run verify` (PASS, all steps) |
| `#crash` flake (shell.spec) | Cause: on a cold load the router's first `replaceState` wiped a hash set before the app hydrated, so the hook never saw it (16 of 20 fresh loads missed). Fix: the handler reads `HashChangeEvent.newURL` (`Shell.tsx`), and the test waits for the engine status to leave `starting` (the shell's effects have run) before it sets the hash. After: 0 of 20 missed. No retries added. |
| UI unit tests (`src/ui`) | 19 of 19 (3 new in `src/ui/hud/stats.test.ts`) |
| Typecheck / eslint on my paths (`src/ui src/app tests/e2e scripts/samples`) | clean / clean |
| Default sample (rings-rand-111x111) | Exact match, 0 mismatches, 12,321 of 12,321 pixels, 111 dots, mean confidence 1.00, coverage 5,480 explained, 0 uncertain, 0 unexplained bytes |
| text-fire-160x32 (non-default bundled) | Exact match, 32 dots. The false "Your own file has no reference picture" line is gone. |
| Blind test (held-out, 150x90) | Exact match, 0 mismatches, labelled "Blind test: held-out file, never used for tuning" |
| User file (sample bytes handed in as `mine.bin`) | "No reference available", no number, "Nothing here says it is correct." |
| Mutated sample (one run colour byte flipped, in test) | "Not exact" in failure red, count over 0, first mismatches listed as `row r, col c: rgb(...) expected, rgb(...) found` |
| Downloads | PNG via `encodePng` + `browserDeflate`: decoded pixels equal the reference PNG byte for byte. JSON via `buildEvidenceReport`: parses, 111 rows, `verification` = reference, exact, 0. Blob URLs only. |
| axe | 0 violations at 1440x900 (done state) and 390x844 |
| Console errors / other-origin requests | 0 / 0 |
| Initial JS gzipped | 173,030 bytes (limit 250 KB) |
| Phone page height at 390 wide, done state | 1,414 px (limit 1,500) |
| Beat 5 frame rate, 1x, first measure (host about 2 GB free, 4 runs) | p50 59.9 / 30 / 59.9 / 59.9 fps; p95 15 to 20 fps. Failed the 55 fps bar. |
| Beat 5 frame rate, 1x, re-measure (host 4.7 GB free, one worker, 2 runs + the verify run) | p50 59.9 fps, p95 59.5 fps (16.8 ms) in all 3; 1, 6 and 5 frames over 33 ms. Bar met. No A/B was needed. One CSS change sat between the two measures: the HUD column is no longer its own scroll box (`overflow-y: auto` removed), so its share cannot be told apart from the memory change. |

Screens: `docs/verification/screens/t17-done.png`, `t17-blind.png`, `t17-phone-done.png` (390 x 1414 full page).

## What was built
- Verification (F-05, R-U20): after recovery the page fetches the sample's reference PNG, decodes it with `decodePng` + `browserInflate`, and sends it to the worker's `verify` message (`runVerify` in `src/ui/worker/client.ts`). Badge, big number and bar come from the returned `VerificationReport`. Every bundled sample carries its reference, so every one is checked (`src/ui/Shell.tsx`, `start`).
- Confidence Grid (F-10, R-U18): one button per recovered row, coloured by the row's real status. Columns fit the row count (cap 16). Hover and focus show the row's rule, confidence and bytes; arrows move, Enter or click picks the row through the T-15 selection (inspector, lit bytes, line). "List view" shows the same as a text list.
- Charts (R-U19), hand-built SVG, shown and drawn in at beat 6 only: confidence by row (1.5 px line, accent fade fill, glow, three grid lines, dashed mean with a direct "mean" label); byte coverage segmented bar with real byte counts; mismatches by row sparkline (flat at 0 when exact, red otherwise). Labels are HTML at 12 px or more, tabular numerals. Tooltips on hover and keyboard (arrow keys) with a live region.
- Sample picker in the footer, listing every bundled sample; the blind test shows its label.
- Tests read the default sample's id and size from `public/samples/index.json` (`tests/e2e/sample.ts`) instead of hard-coding 111.

## R-4 findings (`docs/verification/review-t16.md`)
| Finding | Status |
|---|---|
| F1 Proof beat has no proof | done: filled chart, real big number, badge land at beat 6. "Fills in at Proof" copy removed. |
| F2 line crosses hex text | done: the line now leaves from the bytes panel's right edge (`L3Evidence.tsx`). |
| F3 bundled samples say "no reference" | done: reference fetched and checked for any bundled sample. |
| F4 L0 shows through panels while blur rests | done in CSS: panels go to `rgba(11,13,20,0.92)` while playing. Frame rate re-measured: p95 below 55 fps (see table). |
| F5 beat 3 contest | partly: duplicate losers are folded, note says "N more behind these"; the winner's ranges light in the hex by default at beat 3. Loser fade animation deferred. |
| F6 beat 5 line follows the scan | deferred (polish). |
| F7 larger scale for wide strips | deferred: not reached in budget. |
| F8 grid shape | partly: columns chosen so the last row is at least half full when possible. |
| F9 phone | HUD part done: empty HUD hidden until data, grid and verification side by side. Title wrap and 4-group hex deferred. |
| F10 rule text cut | done: cut at a sentence end, else at a word, never on a dangling article. |

## Held-out guard
Per the conductor's ruling, `tests/unit/corpus.test.ts` allows `scripts/samples/copy-samples.mjs` (own commit `b49179f`). Checked: the script only calls `copyFileSync` and `statSync` (size) on the held-out file; it never reads, parses or analyses its bytes. Width and height (150 x 90) are written as constants from `blind-test.md`.

## Not verified
Real GPU or phone; screen reader output (only axe and the live region text); the Not-exact path on a real engine fault (only a mutated byte); motion judged by eye.

## Weakest point
Beat 5 frame rate depends on host memory: 59.5 fps p95 with 3 to 4.7 GB free, 15 to 20 fps with about 2 GB free. It was not A/B tested, so a cost under memory pressure is still possible (suspects: the 111 grid dots' glow animation, the near-solid panel fill).
