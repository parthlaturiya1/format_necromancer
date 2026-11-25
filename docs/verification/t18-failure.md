# T-18 Honest failure, failure samples, disclosure, R-5 fixes

Agent: experience-designer. Base `5ff4859`. Headless Chromium, 1440x900 and 390x844, one Playwright worker, built static export. Requirement: R-U23 (F-08). Plus items D1 to D10 from `review-t17.md` (R-5), forwarded by the conductor.

## Result in numbers
| Check | Result |
|---|---|
| `npm run verify` (once, at the end) | PASS, all 11 steps. e2e step 128.9 s |
| New e2e `tests/e2e/t18.spec.ts` | 11 of 11 (corrupted, signature, lower-confidence and random-file cases, each at full and reduced motion; blind button; phone; scale) |
| New unit tests `src/ui/failure.test.ts` | 3 of 3 (rule text cut, failure regions, signature sample recovers) |
| Changed existing e2e | `hud.spec.ts` blind label text now `Held-out file, never used for tuning.` (the owner's D5 asked for a badge plus a sentence). `tests/e2e/sample.ts` finds the blind sample by id (labels now exist on other samples). No assertion was loosened. |
| axe (serious and critical) on the failure, signature, random-file and phone-failure screens | 0 |
| Console errors, foreign requests | 0 |
| Beat 5 frame rate, default sample, 1x | 247 frames, p50 16.7 ms, p95 16.8 ms, 59.9 fps p50, 59.5 fps p95, 2 frames over 33 ms. Free memory before 6.2 GB, after 6.4 GB |
| Phone page height (hud.spec limit 1500) | 1496 |

## F-08 end to end
Sample `corrupt-tail-cut` (shapes 128x96 with the last 768 bytes cut off, 1,746 bytes). Engine reason shown, big, unchanged: "The best hypothesis has no size numbers, so the picture size is unknown." (the recoverer's `There is nothing to rebuild` wording is not used here; the analysis result is ok, the recoverer's own reason is shown).
- Timeline stops at Resurrection in failure red, the four earlier steps done, Proof not reached. If analysis finds no layout the stop is at Listening; if the file cannot be read it is Reading (Dead file).
- Image panel: an empty dashed frame holding the reason, no canvas (test: `canvas.recovered` count 0). Below it, "Found before it failed": guesses with confidence and the engine's `lostBecause`. The only canned text is the title "No picture was rebuilt" and the heading "Found before it failed".
- Bytes: nothing is highlighted. The engine's evidence for the top guess is all below the explained threshold (0.02 to 0.40), so the hex panel shows every byte dim and no row selected. The lit path (explained regions stay lit) is built (`buildFailureRegions`) but **no bundled file exercises it**; not shown on screen.
- Verification: badge "Nothing recovered", text "Nothing recovered, nothing to check." Evidence report download works (test downloads `*-evidence.json`). No image download.
- Failure red appears only here and on the mismatch state of the checker (existing). The timeline, badge, title carry it; the rest stays calm.
- Random 3,000 bytes from a fixed seed: ends the same way with a reason.

Screens: `screens/t18-failure.png` (1440x900), `t18-phone-failure.png` (390x844), `t18-signature.png`, `t18-lowconf.png`.

## Bundled samples (made by `scripts/samples/copy-samples.mjs`, deterministic, tuning samples only)
| Id | Made from | Picker label | Ends |
|---|---|---|---|
| `corrupt-tail-cut` | shapes-rand-128x96, last 768 bytes cut | Corrupted: the last 768 bytes were cut off | unrecovered (robustness-report: tail cut ends unrecovered for 21 of 44 files) |
| `signature-changed` | rings-rand-111x111, first byte plus 1 | The first byte was changed; a standard decoder refuses this file | Exact, 0 of 12,321 pixels differ, checked against the source sample's reference (R-X3 ruling) |
| `changed-lower-confidence` (D8) | text-fire-160x32, last 769 bytes cut | Changed file, recovered with lower confidence: the colour table was cut off | recovered, all 32 rows uncertain (amber), mean 0.60, Exact against Pillow's decode of the same changed file (`corpus/mutations/reference/text-fire-160x32.tail-cut.769.png`, copied) |

The held-out file is untouched by these. The reference of the third sample is Pillow's reading of the changed file (R-X3 truth for non-signature kinds), not the original picture. The label says what changed. The chart for it is flat at 0.60, not a dip: no mutation in the set gives a mixed row set that is also exact. The nearest, `rings size-altered y1-plus1`, has 1 ok and 111 uncertain rows and is Not exact (9,918 mismatches); not bundled.

## Disclosure (J-1)
Footer line next to the result: "Layout inferred by generic detectors; pixels by a format-aware decoder for this layout family (disclosed)." with a link "The honest claim" to `https://github.com/parthlaturiya1/format_necromancer#the-honest-claim` (README heading `## The honest claim`, line 28). README not edited. The link works only once the repo is public and README is pushed.

## Items 4 and 5
- Picture scale (F7): the existing rule already picks the largest whole multiple that fits the box. Measured: rings 3x (333 px in a 376 px box), text-fire 2x (320 px), tiny 48x. Wide strips stay at 2x: 3x needs a box of 516 px and the middle column gives 376. I tried widening the middle column (1.05fr / 1.3fr); the hex panel dropped below its 480 px container breakpoint and the bytes ran together, so I reverted. **F7 not met for text-fire.**
- Inspector rule text (F10): `shortRule` cuts at a sentence end, else a clause end, else a word with dangling words removed. Unit-tested. The row rule now reads "Row 0: bytes 128 to 135 read with the run rule (a marker byte with mask 192 set gives a count…" with the full text under "Show the full rule". Still ends on "count…"; no dangling article.

## R-5 items
| Item | Status |
|---|---|
| D1 picture scale | Partly. Rings 3x. Blind 2x, text-fire 2x. See above. |
| D2 hex rows | Partly. 8 rows became 11 (footer cut from 4 lines to 2, inspector compacted). Not 20. The hard clip of the last row is still there; the fade was not done. |
| D3 charts | Partly. Done: grid lines at 14 percent white, "Row 0" and "Row 110" labels, mean label moved above the plot (no collision with the 1.0 line). Not done: height is 80 px (5rem), the old 84 px in a taller card is the most the HUD column allows at 900 px high. |
| D4 denominator | Done. "0 of 12,321 pixels differ" sits directly above the bar (it is the bar's label; the bar keeps its aria label). The mismatch sparkline (2 px, 85 percent) is drawn only when there are mismatches; a flat line was cut to make room. |
| D5 blind label | Done. Pill "Blind test" in accent (not amber) plus "Held-out file, never used for tuning."; button "Load the blind test" at the top of the Bytes panel. Test checks the pill colour is not `#ffb454`. |
| D6 downloads | Partly. Stacked full width, no wrap on desktop, image is the primary style. Labels not renamed, no icon. |
| D7 grid dots | Partly. Dots 11 px, cell 17 px (6 px gap), glow only on hover, focus and beat 5, hint shortened to "Hover or focus a dot." Column count unchanged (16 for 111 rows). |
| D8 amber sample | Done, with the caveat above (flat 0.60, not a dip). |
| D9 phone | Deferred to T-21, except: downloads in two columns not one, page height 1496 under the 1500 limit, failure screen shows the verification card. Title cut, byte gap and timeline labels not touched. |
| D10 footer | Partly. The picker moved to the Bytes panel as "Try a sample" with an accessible name; Reduce motion stays in the footer; footer is two lines. The select is not restyled as a pill. |

## Not verified
- Motion on the failure screen (there is none by design); the lit-bytes path of the failure view (no sample reaches it).
- Contrast numbers for the new pill and failure text; axe passed.
- Layout at heights other than 900; the HUD column scrolls (hidden scrollbar) if the content grows.
- The README link target after publishing.

## Weakest point
D1, D2 and D3 are only partly met. The three columns and the 900 px height are a fixed budget, and each extra element I added (picker row, disclosure, denominator) took room from the hex window and charts. A real fix needs a layout pass, not more patches.
