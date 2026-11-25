# T-16: ritual, speed, reduced motion, demo mode

Agent: experience-designer. Covers R-U13 to R-U17 (F-01, F-06, F-09), the R-2 items N2, N3, N10, F8 and the R-3 items marked T-16.

## What was built
| Part | Where |
|---|---|
| Beat state machine. Plays six beats from the one `PipelineResult`; timers only, no engine wait. | `src/ui/ritual/ritual.ts` |
| Beat 1 grey bytes. Beat 2 scan sweep over the hex, detector chips pulse (names are the winner's own evidence ids). Beat 3 top three guesses with the engine's confidence and `lostBecause`; hover or focus lights the guess's byte ranges. | `BytesPanel.tsx`, `ImagePanel.tsx` |
| Beat 4 lines and dashed row boxes draw in (three confident rows from the first screen of bytes, same rows every run). Beat 5 picture reveals row by row, grey to colour, with a scan edge; an uncertain row flickers amber for 700 ms then settles (fixed sine of time, no randomness). Confidence Grid dots light in sequence, one per recovered row, coloured by the status the engine gave that row. Beat 6 Proof step is current; the mint line "Recovered without the format specification." shows. | `ImagePanel.tsx`, `L3Evidence.tsx`, `Hud.tsx` |
| Speed pill: click or Enter cycles 0.5x, 1x, 2x, 4x. Kept in `sessionStorage`. `?speed=N` sets it. Every CSS time and every JS timer is divided by it. | `Shell.tsx`, `shell.css` |
| Reduced motion: follows `prefers-reduced-motion`, plus a "Reduce motion" switch in the footer. Each beat shows its end state, with "Next beat" and "Skip to result". All CSS animation is off, L0 drift stops. There is no parallax in this build, so nothing to turn off there. | `Shell.tsx`, `shell.css` |
| Demo mode: "Resurrect a sample" plays the default sample. `?demo=1` starts it after load. `?beat=N` (with optional `&p=0.5`) starts it and holds beat N at that share. `?motion=reduced` for tests. No random numbers anywhere in the ritual. | `Shell.tsx` |

## Timing (design.md table, 1x)
Beats 1 to 4 and 6: 0.8, 1.5, 2.5, 1.5, 1.5 s. Beat 5: 2 s + 20 ms per row, between 3 and 6 s (111 rows: 4.22 s). Unit test: `src/ui/ritual/ritual.test.ts`.

## Numbers (headless Chromium, software rendering, 1440x900)
| Check | Result |
|---|---|
| Beat 5 frame rate at 1x, default sample (rAF deltas, 252 frames) | p50 16.7 ms (59.9 fps), p95 16.8 ms (59.5 fps), 1 frame over 33 ms. Target 55 fps: met. Raw: `docs/verification/t16-fps.json` |
| Same measure before the fix | p50 33 ms (30 fps), 47 of 121 frames over 33 ms. Cause: the panels' `backdrop-filter` blur was redrawn every frame. It now rests while the ritual plays (`.app[data-ritual='playing'] .panel`). The L0 drift keeps running. |
| Whole run, 4x vs 1x (start of beat 1 to start of beat 6) | 2 732 ms vs 10 600 ms, ratio 0.258 |
| Initial JS gzipped | 168 105 bytes (limit 250 000) |
| Unit tests | 161 pass (22 files) |
| Playwright | 26 pass, 5 skipped (screenshot tests, need SHOTS=1) |
| Lint, typecheck | clean on `src`, `scripts`, `tests`. `npm run verify` stops at lint on `tmp-hookdebug/dump.cjs` only (owner's IDE task, not touched). |

## Acceptance
| Feature | Evidence (tests/e2e/ritual.spec.ts) |
|---|---|
| F-01 six beats in order | `data-beat` recorded by a MutationObserver is exactly 1,2,3,4,5,6. Timeline `aria-current` ends on Proof. Axe 0, console 0, other-origin requests 0. Speed 4x test. |
| F-06 deterministic | Two fresh `?demo=1` runs give the same stage text, footer text, canvas pixels (data URL) and evidence-line path. |
| F-09 reduced motion | With the system setting: beat 1 stays 1.8 s without moving on, Next beat steps 1 to 2 to 3, losers already dim at 0.5, `document.getAnimations()` is 0, Skip to result ends at 111 of 111 rows, axe 0. The in-app switch gives the same. |
| Content comes from the result | Beat 3 cards show confidence `d.dd` and `lostBecause` from the engine; beat 5 at `p=0.5` shows 55 of 111 rows and 111 grid dots. |
| N10 phone header | Timeline full width under the brand, label centred, Speed pill 44 px (test). |

Screens (1440x900 unless noted): `screens/t16-beat3.png`, `t16-beat5.png`, `t16-done.png`, `t16-phone-done.png` (390x844). All eleven samples finished: `screens/samples/`.

## Default sample (N2): NOT changed
I rendered all 11 samples. Reading best on the dark one-accent design: **text-fire-160x32** (dark red plate, melts into the black UI, warm against the mint, and it spells the product name). Next: vgrad-fire (gradient, but all rows alike so the row reveal shows nothing). `rings-rand-111x111` has the dull slate-blue plate R-3 F4 complains about, but its reveal is the most dramatic.
I kept `DEFAULT_ID = rings-rand-111x111` because five existing assertions are tied to it: `panels.spec.ts` (111 rows, the reference png name, the region name, a colour count) and `inspector.spec.ts` (`clickRow` height 111). Changing the default means editing tests I did not write. To switch: set `DEFAULT_ID = 'text-fire-160x32'`, run `npm run samples`, and change those numbers to 32 rows. Decision for the conductor. Also: no sample has an uncertain row, so the amber flicker and the second (amber) line are in the code but not seen on screen.

## R-2 items
| Item | Status |
|---|---|
| N2 default sample | deferred, see above |
| N3 outlines for explained runs in beats 4 and 5 | done: dashed boxes on the three trail rows |
| N10 phone header | done |
| F8 mint footer line | done |

## R-3 findings (review-t15.md)
| F | Status |
|---|---|
| F1 line | done: 2 px, glow (`drop-shadow` 8 px, 55%), cap at each end (6 px core, 12 px halo), curve ends 8 px inside the row's left edge, dashed 1 px row box instead of a bar, stroke fades from 100% to 70%. A second line (other status) is drawn when the run has one; none in the default sample, so not seen. Existing test changed from `1.5px` to `2px` as the review asks. Draw-in belongs to beat 4 and is staggered. |
| F2 inspector | done: rule one line up to 90 characters then "Show the full rule", bytes line mint (amber when uncertain), confidence pill, chips wrap, nothing clipped. |
| F3 right column | text overlap done (the note moved out of the chart). Grid now shows real rows (extra, for the ritual). Chart fill deferred to T-17. |
| F4 plate | done: outer border dropped. Sample pick deferred, see above. |
| F5 columns | done: the three columns end on one baseline (see `t16-beat3.png`); frame stays centred. |
| F6 footer | done: left lines, right one muted line (max 90 ch), gradient strip above L0. |
| F7 phone | chips in one row with a fade mask: done. Hiding the empty HUD cards: deferred to T-17. Page length not measured. |
| F8 hex | partly: explained bytes outside the picked region drop to 70%, the picked run gets a rounded 6 px box. Outlining up to three runs of the same rule: deferred. |
| F9 phone timeline | done (same as N10). |
| F10 accent | done for the "Recovered 111 by 111" label, hypothesis label and chips (now `--text`). Mint stays on lines, lit bytes, progress bar, the mint bytes line and the footer line. |

## Existing tests changed (setup and R-3 values only)
- `inspector.spec.ts`: `openSample` opens `/?speed=4`, clicks "Skip to result", waits for `data-ritual="done"`. Line width `1.5px` to `2px` (F1).
- `panels.spec.ts`: sample test opens `/?speed=4` and waits for `data-ritual="done"`.
No assertion was removed or loosened.

## Other changes made on the way
- Fixed-height layout now needs 820 px of window height (was 700). With wrapping chips the inspector squeezed the hex panel to zero height at 720 px. Below that, the page scrolls and the hex window is 24 rem.
- Confidence grid header showed "rows" with no number (a template bug). It now reads "111 rows".
- Progress bar uses `transform: scaleX`, not width.

## Not verified / weakest point
- Frame rate is from headless software rendering, not a real GPU or a phone.
- Amber flicker and the amber second line have no sample that shows them.
- `backdrop-filter` is off while the ritual plays, so panels look less frosted for about 10 s, then return.
- A speed change during a beat restarts that beat's timer (noted as a shortcut in `ritual.ts`).
- Hover-to-light needs a pointer or focus; on a phone the cards are tappable buttons but the hex is far below the cards.
- Charts and verification numbers are T-17.
