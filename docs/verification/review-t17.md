# R-5: design review of T-17 (HUD, verification, downloads vs the design target)

Reviewer: design only. I wrote none of this code and changed none. Owner ask: "10 of 10 in all aspects".
Read and viewed: `docs/design-target.png`, `screens/t17-done.png`, `t17-blind.png`, `t17-phone-done.png`, `t17-hud.md`, `review-t16.md`, `judge-gap-review.md`, `design.md` (HUD, Confidence Grid, Charts), `requirements.md` R-U18 to R-U22, `README.md`. Grepped `src/ui/Shell.tsx` and `src/ui/hud/Hud.tsx` for pointers only.
Not done: no browser run, no motion judged (stills at 1440x900 and 390 wide), the other bundled samples not viewed, the opening screen (dead file state) has no T-17 still, contrast not measured. Pixel values are read off the stills, so they are +/- 4 px.

## 1. Verdict
The Proof screen is now honest and complete (real badge, real chart, real downloads) but it is a clean dashboard, not an award entry: the picture sits at 2x in a panel twice its size, the hex panel shows 8 rows against the target's 20, and every chart is a flat slab because the data is all 1.00, so the first 10 seconds on the Proof beat look sparser than the mock.

## 2. R-4 findings: really fixed?
| R-4 | In the T-17 stills | Verdict |
|---|---|---|
| F1 Proof has no proof | Filled chart, "0 mismatches", "Exact match" pill, coverage bar all present. Quality is thin (see D3, D4). | yes |
| F2 line crosses hex text | Line leaves the panel edge (x about 566) in clear space, ends on the picture's dashed row box. No strike-through. | yes |
| F3 bundled samples say "no reference" | Default and blind both verify. Other bundled samples not viewed. | yes for the two seen, unverified for the rest |
| F4 L0 through panels | Panels at rest look clean. The playing state is not in these stills. | not visible, unverified |
| F5 beat 3 contest | Not in T-17 stills. Disclosed as partly done. | partly |
| F6 line follows the scan | Deferred. | no |
| F7 larger scale for wide strips | Deferred. Rings is still 222 px in a panel about 340 px wide and 630 px tall. | no |
| F8 grid shape | 111 dots at 15 columns gives 7 full rows and 6 orphan dots (40 percent). The "at least half full" rule is missed. 14 columns gives 7 full rows of 14 plus 13 (93 percent). | partly |
| F9 phone | Empty HUD hidden, grid and verification side by side. Title still cut ("5,480 ..."), timeline shows only "Proof", hex has no byte spacing. | partly |
| F10 rule text cut | Now ends on "gives..." with a "Show the full rule" link. Better, but "gives" is a dangling verb. | partly |

## 3. Findings, ranked by first-10-seconds impact
Task codes: T-18 now (T-18 is open, fold in if cheap), T-19 verifier, T-21 perf/a11y/phone, T-24 docs, polish.

**D1. The picture is small in a big dark panel.** Where: `t17-done.png` image panel, rings at 222 px inside a panel of about 340 x 630 px; `t17-blind.png` 300 x 180 in the same box. Target: the ghost fills about two thirds of its panel (about 360 px of a 720 px panel). Build: about 35 percent of width, 45 percent of height, with 100 px of void above and below. This is the one image a judge screenshots. Fix: choose the largest whole multiple that fits the inner width (rings 111 px x 3 = 333 px fits 340), and let the panel shrink to content plus the progress row so the three columns still end together (push the "Rebuilt 111 by 111" note and Hypothesis block up under the picture, with 24 px gap). For the blind file 150 x 90, 2x is the cap at this width; widen the centre column from `1fr` to `1.15fr` in `.stage` (`src/ui/shell.css` line 52) so 3x (450 px) can fit, or accept 2x and center vertically. Task: T-18 now, else polish.

**D2. The hex panel is a short window, not a wall of bytes.** Where: Bytes panel, 8 rows with the top row ("000040") cut in half by a hard clip; the target shows 20 rows, a lit hex block, depth. Build: bottom 210 px of the panel is empty above the legend, and Row 0 inspector below it repeats the same area. Target: a tall panel the same height as the picture panel, with the lit run, the evidence line leaving it, and the Row card as a separate lower card. Fix: raise the visible rows from 8 to 14 or more (row height token `--row-h`, about 22 px) so the panel reaches y 400, and replace the hard top clip by a 24 px mask-image fade (`linear-gradient(transparent, #000 24px)`). Keep the picked row at the vertical centre. Task: T-18 now, else polish.

**D3. Charts are flat slabs and too small to read as charts.** Where: "Confidence by row" card (`t17-done.png` x 1111 to 1373, y 338 to 400). Rules in `design.md` Charts: 1.5 px line, accent-to-transparent area, soft glow, three faint grid lines, direct labels, tooltips, draw-in at beat 6.
- Seen: line, fill and the 1.0 / 0.5 / 0 labels exist; the grid lines are almost invisible; "mean 1.00" sits on top of the fill so the label and the 1.0 line collide; no dashed mean line is visible (it hides under the line at 1.00); no x-axis labels (target has "Row 1" and "Row 18" at both ends).
- Height is about 55 px against the target's 130 px, so the chart reads as a thick bar next to the coverage bar.
- Fix: chart height 96 px (from about 55), `viewBox` with 0.5 and 0 grid lines at 8 percent white, x labels "Row 1" and "Row 111" at 12 px muted, mean label moved to the card header right ("mean 1.00", like the target) and a dashed mean line drawn 3 px inside the top so it does not hide under the data line. When every value is 1.00 draw the Y range 0.8 to 1.0 only if the axis says so; otherwise keep 0 to 1 and accept the slab, it is honest.
- A judge cannot tell a working chart from a broken one when it is flat. The mutated-sample run (some rows below 1.00) is the only state where the chart shows its quality. Bundle one mutated sample and screenshot it (see D8). Task: T-18 now (chart size and labels), T-19 (mutated screenshot).

**D4. The Proof beat never states the denominator, and the verification card has an unlabeled bar.** Where: Verification card. Build: "0 mismatches", then a full-width mint bar with no label, then "Mismatches by row flat at 0" and a 1 px line at about 40 percent opacity, nearly invisible on dark. Target: "Rows checked 18 of 28" under the bar. The number 12,321 (111 x 111 pixels, `t17-hud.md`) appears nowhere on screen, so "0 mismatches" has no scale: a judge cannot tell 0 of 10 from 0 of 12,321. Fix: line under the big 0: "of 12,321 pixels checked" (13 px, text colour), label the bar "Rows checked 111 of 111", and draw the mismatch sparkline at 2 px, `--accent` at 80 percent, 24 px tall. Pointer: `src/ui/hud/Hud.tsx` line 271 for the sparkline label. Task: T-18 now.

**D5. The blind-test label is in amber and small.** Where: `t17-blind.png`, "Blind test: held-out file, never used for tuning", 12 px orange text between the badge and the bar. Problems: (1) amber is the "uncertain" token in `design.md` Tokens, so a verified result is tagged in the uncertain colour; (2) it is the strongest claim in the product and gets the lowest visual weight; (3) the way to reach the blind file is the footer's native select labelled "Choose a sample" (`src/ui/Shell.tsx` lines 254 to 258), and the option text for it is not visible in the stills. Fix: a pill like "Exact match": "Blind test" in accent text on an accent 12 percent fill, 28 px tall, placed beside the Exact match pill; the sentence "Held-out file, never used for tuning." under it in muted text at 13 px. Add a visible "Try the blind test" button in the footer next to the sample picker. Task: T-18 now.

**D6. Downloads are findable but weak.** Where: Verification card bottom. Build: two buttons side by side at about 126 px wide; "Download evidence report" wraps to three lines, "Download image" to two; the second button is the quieter style. Target: R-U21 asks only for the two downloads. A judge who wants the evidence JSON must read a three-line label. Fix: labels "Image (PNG)" and "Report (JSON)" with a 16 px download icon, one line each, 40 px tall, equal weight; stack them if the card is under 280 px. Keep the Verification card as the home (it is the right place). Task: T-18 now.

**D7. Grid dots merge into a slab.** Where: Confidence grid card. Build: 111 dots about 13 px with 3 px gaps and a glow that touches the neighbours, so at rest it reads as a mint block with a bumpy edge. Target: dots about 11 px with 6 px gaps, glow only on the lit or hovered dot, the mix of steady and dim giving texture. Also the hint "Hover or focus a dot to inspect it." leaves "it." alone on a line. Fix: dot 10 px, gap 6 px (token `--sp-2` is 4 px, use a new `--grid-gap` 6 px), glow only on hover, focus and during beat 5; columns 14 for 111 rows; shorten the hint to "Hover or focus a dot." and put "List view" on the same line. Task: T-18 now, else polish.

**D8. The product has only ever shown its best case on the Proof screen.** Where: all three T-17 stills show Exact match, mean 1.00, 0 mismatches, an all-mint grid. The target's drama comes from amber and dim dots and a dipping chart. The honest states exist (T-17 test for Not exact; mutation corpus) but no still shows them. A judge who loads one sample sees "perfect" with no texture and nothing to compare against. Fix: bundle one mutated file in the picker, labelled "Damaged header (uncertain)", whose result has amber dots, a dip in the chart and an honest status, and screenshot it for the README. Do not fake amber. Task: T-18 (the failure sample) and T-19 (verify the amber path with a screenshot).

**D9. Phone at 1,414 px: usable, not yet first class.** Where: `t17-phone-done.png` (limit 1,500, so the number passes).
- Title "5,480 ..." cut; wrap to two lines (`.fileline` has `white-space: nowrap`, `src/ui/shell.css` line 33).
- Timeline shows only the current step; fine, but the dots have no labels at 390 px. Keep the label of the current step, add the step number "6 of 6".
- Picture is 150 px wide in a 360 px card; scale 3x does not fit 330 px, but 2x would (222 px). The card also has about 60 px of empty space below.
- Hex runs together ("F000CF81F00000") because `.hex-bytes` drops its gap at narrow width (`src/ui/shell.css` line 94); the 4-group margin on line 95 should have separated them but the stills show no space. Check at 390: set a 2 px gap and group of 4 with 6 px.
- "Confidence grid 111 rows" wraps in the narrow card; "Mismatches by row flat at 0" wraps into three lines; at 390 wide, shorten to "By row: flat at 0".
- Download buttons: same fix as D6 at full width.
Task: T-21 (phone), polish.

**D10. Footer is cluttered.** Where: bottom 100 px of `t17-done.png`: a status line with a dot, a green sentence, then a row with the native select, "Reduce motion: off" and the credit line at 12 px, low contrast, over one baseline. The target has two quiet lines. The native `<select>` is the lightest-weight control in the app but is the way to try other samples. Fix: style the select as a pill like "Choose file" (36 px, 1 px border), label "Try a sample", credit line 12 px muted on its own right-aligned line at the bottom. Task: polish.

## 4. README vs the screens
| README claim | What the screens show | Verdict |
|---|---|---|
| Step 2: "Press **Resurrect a sample**" | No button with that name in any T-17 still. Done state shows "Choose file" and a select "Choose a sample". The start state is not in the stills. | Not backed. Check the live opening screen and fix the wording. |
| Step 3: "Click a row of the picture. The matching bytes light up" | Stills show the Row 0 inspector and lit bytes. Whether a picture row click works is not visible (T-17 notes say grid dots click through the T-15 selection). | Unverified. Say "click a dot in the grid or a row of the picture" only after T-19 checks both. |
| Step 4: verification panel | Present: "Exact match", 0 mismatches, downloads. | Backed. |
| Step 5: "Load the blind-test file" | The label appears in `t17-blind.png`, but the way to load it is a select option whose name is not visible. | Partly. Name the exact option in the README, and add the button from D5. |
| "A damaged file ends as 'unrecovered' with the reason in plain words" | No screen shows it. T-18 is not built at HEAD 5ff4859. | Not backed until T-18 lands. |
| Results row "Animation 59.9 fps median over 253 frames" | `t17-hud.md` records p95 of 15 to 20 fps on a 2 GB-free host and p95 59.5 on 4.7 GB free. README gives the good run only. | Add one line: "p95 depends on host memory; see t17-hud.md". |
| Reviews "review-t13 to review-t16" | Now through R-5 (this file). | Update in T-24. |
| "Limits: blind-test file comes from the same generator" | Matches the blind still: a synthetic bullseye. | Backed and honest. |
| README has no image | A judge reading the README first sees no picture of the product. | Add `t17-done.png` (or a 6-beat GIF) under the title. T-24. |

## 5. Keep list
- Evidence line clear of the hex text, ending on a dashed row box (R-4 F2 is really fixed).
- "Exact match" pill, big "0 mismatches", and the honest "No reference available" state for user files.
- Accent-only palette; red kept for failure; amber reserved (except the D5 misuse).
- "Runs in your browser. Nothing is uploaded." and "Recovered without the format specification." in plain words.
- Confidence grid with a "List view" text twin; Row card with rule, bytes, confidence pill and chips.
- Timeline of six beats and Speed control in plain view; the blind still with Speed 4x shows it works.
- Sample list built from `index.json` rather than hard-coded.
- Phone ordering: picture first, grid and verification side by side.

## 6. Rule breaks, with pointers
1. `design.md` Tokens: amber `#FFB454` means uncertain; the blind-test label uses amber (D5). Pointer: the blind label is styled in `src/ui/hud/` (exact class not located; text is built in `Hud.tsx`).
2. `design.md` Charts "three faint grid lines, direct labels": the mean label collides with the 1.0 line and no x labels (D3). Pointer: chart code in `src/ui/hud/Hud.tsx`.
3. `design.md` Confidence Grid says dots are steady, amber, dim, red: only steady seen, so the legend is never exercised on screen (D8).
4. `design.md` Motion "text never moves while being read": not checkable from stills.
5. `requirements.md` R-U21 (downloads): met, but the labels wrap to three lines (D6). R-U22 (blind labelled): met, with the wrong colour (D5). R-U20: met, without the denominator (D4).
6. Guardrail 12 style (claims must be backed): README step 2 and the "unrecovered" sentence are not backed by any screen yet (section 4).
7. Phone: `.fileline { white-space: nowrap }` (`src/ui/shell.css` line 33) cuts the title; the byte gap at `@container (max-width: 480px)` (line 94) removes spacing (D9).

Skipped: motion, hover tooltips, the other eight bundled samples, real-GPU timing, screen reader output. Risk: values come from stills; the D2 and D9 hex observations should be confirmed in a live browser before work starts.
