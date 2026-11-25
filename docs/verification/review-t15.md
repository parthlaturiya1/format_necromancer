# R-3: design review of T-15 (inspector and evidence line vs design target)

Reviewer: design only, wrote no code. Inputs: `docs/design-target.png` (2400x1350), `screens/t15-desktop.png` (1440x900), `t15-phone.png` (390x2301), `t15-inspector.md`, `review-t14.md`, `src/ui/shell.css` (read only grep). Not done: no browser run, no contrast tool, `.kiro/steering/design.md` and the experience specs were not re-read this round.

## 1. Verdict
The engine story is now real (header lit, line drawn, picture at 3x), but the first 10 seconds still lose to the target: the line is a thin whisper, the right column is hollow beside a finished image, and the inspector is a text block with a cut-off chip row.

## 2. R-2 findings: really fixed?
| R-2 | Seen in T-15 | Verdict |
|---|---|---|
| N1 grey header | Rows 000070 to 000120 all mint. Header lit. | yes |
| N2 picture size and plate | 333 px at 3x, framed, glow behind frame. The slate-blue plate and rainbow still clash with mint; default sample not changed. | partly |
| N3 evidence lines | One line, one row. No outlines for explained runs (only the picked bytes have a box). | partly |
| N4 empty HUD | False "0" gone. Grid is still 70 hollow rings, chart still says "no data / Appears after Resurrection". Beside a finished image it still reads empty. | partly (T-17) |
| N5 text wall | Short line plus "Show the full reading". Good. The row card is now the wall (see F2). | yes |
| N6 header title | "rings-rand-111x111.pcx, 5,480 bytes". Clean. | yes |
| N7 region card | Row 7 picked at once. | yes |
| N8 footer | Aligned and on a gradient, but see F8. | partly |
| N9 phone hex | 4 groups, readable. Length now 2301 px, worse than 2157. | partly |
| N10 phone timeline | Dots still tiny at top right, Speed pill alone on its own row. | no (T-16) |

## 3. New findings, ranked by first-10-seconds impact

**F1. The evidence line is too thin and too short to be the signature.** Where: `t15-desktop.png`, hex row 0000C0 to the picture top edge. Target: a 2-line story, one mint and one amber, curves about 400 px long that cross a gap and land on a dot with a glowing end cap, lit row boxes at both ends. Build: one 1.5 px line, about 200 px long, almost flat. The landing is a horizontal bar across the full picture width at row 7 (y 261), so it reads as a ruler, not a pointer. The start has no dot. Fix: line 2 px at rest, glow `drop-shadow(0 0 8px accent 55%)`; end caps 6 px filled circles at both ends (target has them); end the curve inside the row's left edge, not at the picture edge; keep the row outline as a 1 px dashed `--accent` box like the target (y 530 to 570), not a full-width bar; stroke gradient from `--accent` 100% to 70%. Task: T-16 ritual (the draw-in belongs to it); caps and outline "T-16 now".

**F2. Inspector card is dense text with a cut-off chip row.** Where: card "Row 7" under the bytes. Build: 4 text lines at 13 px plus a 2-line mono bytes line, a chip row that overflows: "Run pairs" is clipped at the panel edge (`t15-desktop.png` x 570), with no scroll hint. The 40-word rule sentence repeats "Row 7: bytes 197 to 212" which the title already says. Target: 3 short lines (title, rule in one sentence, mint bytes and confidence line). Fix: (a) show the engine's rule text only as a single line of at most 90 characters, rest behind "Show the full rule" like the hypothesis; (b) bytes line mint, `--fs-sm`, not mono-grey; confidence as a pill (`0.96 confident`, 24 px high, accent 14% fill); (c) chip row `flex-wrap: wrap` on desktop too, or `overflow-x: auto` with an 24 px right fade mask. Wrapping is right: nothing may be clipped. Task: T-16 now (cut-off is a bug).

**F3. Right column is hollow beside a finished image.** Where: Confidence grid, by row, Verification. Build: 70 hollow rings, an empty chart with a floating "Appears after Resurrection" over the axis labels (the text overlaps the "0.5" and "0" labels), and a paragraph. Target: lit dots, a filled area chart, a big number. This is the most visible gap to the target. Fix (honest, before T-17): once recovered, fill the grid with the 111 real row confidences (1 dot per row, 15 columns, mint at or above 0.9, amber below, same thresholds as the engine); draw the real row-confidence curve. Remove the overlay text when data exists. Task: T-17 HUD (grid and chart); overlap text fix "T-16 now".

**F4. Picture plate.** Where: image panel. Build: frame is good (inset dark card, glow). The picture's own slate-blue background is the largest flat colour on screen and reads dull next to the black UI. Fix: nothing on pixels. Choose the default sample whose real background sits best on `--bg-1` (state the pick in `copy-samples.mjs` `DEFAULT_ID`); if all 11 are blue, accept. Also the outer plate (`.image-stage` border, y 175 to 635) is a box inside a box inside a panel: 3 nested borders. Drop the outer plate border to 0 and keep only the frame. Task: T-16 now (plate), conductor (sample pick).

**F5. Panel heights do not align; dead space under the image.** Where: all three columns. Build: bytes panel ends y 520, inspector y 790, image panel y 790, right column y 790 but with 4 cards of unequal gap. The picture block floats mid-panel with about 40 px empty above and below the frame, then the hypothesis text. Target: all three columns end on one baseline (y 1140 in 1350 scale), the picture centred. Fix: `align-items: stretch` on the stage grid, `place-self: center` on the frame, `row-gap: var(--sp-4)` everywhere; right column cards `flex: 1 1 0`. Task: T-16 now.

**F6. Footer.** Where: `.foot` right credit. Build: 2 lines, right-aligned, overlaps the L0 noise text ("0D 26") at x 920; left line is 20 px lower than the credit baseline. Gradient strip not visible in the screenshot. Target: left two lines, right one muted line, both on the same baseline. Fix: `align-items: end`; credit one line at `--fs-xs` with `text-wrap: balance`, `max-width: 90ch`; strip `height: 64px` with `linear-gradient(transparent, var(--bg-0) 60%)` and `z-index` above L0. Task: T-16 now.

**F7. Phone length 2301 px.** Where: `t15-phone.png`. Build: the chip list wraps into 4 rows, card is tall, then three empty HUD cards (about 640 px of nothing). Fix: hide the empty chart and the empty grid on phone until data exists; show one "Rows rebuilt 111 of 111" bar; chips as one row with `overflow-x: auto` and a fade mask (phone only, since touch scroll is clear); hex window 10 rows. Target under 1500 px. Task: T-17 for the cards, T-16 now for chips.

**F8. Hex does not show explained runs the way the target does.** Where: bytes panel. Build: whole 16-col rows are mint, so everything is "explained" and the one picked run (outlined, white-ish boxes) is the only contrast. Target: a few outlined runs with rounded 6 px boxes, the rest grey. Mint on the whole window loses the meaning of the colour. Fix: keep mint for explained but drop it to 70% opacity for bytes outside the selected region and keep 100% plus glow in the outlined run; outline all runs of the selected rule (up to 3), 1 px `--accent` 55%, `border-radius: 6px`. Task: T-16 ritual.

**F9. Timeline and Speed on phone.** Where: header at 390 px. Build: six 8 px dots at top right, label "Resurrection" under, Speed pill on its own row, title truncated "5,480...". Fix: timeline full width on its own row under the brand, dots 10 px, label centred under the current dot; Speed pill 44 px high on the brand row, right. Task: T-16 ritual (header layout).

**F10. Hypothesis line next to the bar.** Where: image panel, below the frame. Build: short line is good, but "Hypothesis 1 of 12" is accent while the same colour is used for "Recovered 111 by 111" top right, the line, the bytes: mint is everywhere so nothing leads. Fix: the label "Recovered 111 by 111" in `--text`, keep accent for the line, the lit bytes and the progress bar only. Task: T-16 now.

## 4. Keep list
- Header bytes now lit, with a real analysis behind it (N1 closed).
- Picture at a whole 3x, `pixelated`, framed with glow behind the frame, not on pixels.
- Best region picked at once on run end; no dead card.
- Short hypothesis line plus "Show the full reading".
- Phone hex in 4 groups with a gap.
- Header "name, N bytes". Honest empty-HUD copy with no fake zeros.
- 0 axe violations, 160.8 KB initial JS.

## 5. Rule breaks, with pointers
1. Clipped content (chip row, "Run pairs"): the panel hides its overflow without a wrap or scroll. `src/ui/shell.css` `.panel-inspector` (line 76) has no `flex-wrap` for the chip row; check the chip container class in `src/ui/panels/`. Not confirmed which file holds the chip row.
2. Text overlapping labels in Confidence by row ("Appears after Resurrection" over "0.5" and "0"): `src/ui/hud/` chart overlay. Not read this round.
3. Nested borders (outer plate, frame, panel): `.image-stage` in `src/ui/shell.css` (grep found only the drag rules at lines 98 to 99; the base rule was not located).
4. One accent: mint is used for 6 different roles on one screen (F10); the one-accent rule is kept but the hierarchy is lost.
5. Footer sits over L0 noise: `.foot` strip not visible in `t15-desktop.png`.

Skipped: base `.image-stage` and chip row CSS not located; steering and spec files not re-read; no measured contrast. Risk: F1 sizes are read from a 1440 px screenshot and scale differently from the 2400 px target.
