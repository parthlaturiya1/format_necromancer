# R-2: design review of T-14 (panels vs design target)

Reviewer: design only, wrote no code. Inputs: `docs/design-target.png`, `screens/t14-desktop.png`, `t14-phone.png` (390x2157), `t14-empty-desktop.png`, `t14-panels.md`, `review-t13.md`, `.kiro/steering/design.md`, and read-only greps of `src/ui/` (`shell.css`, `tokens.css`, `panels/BytesPanel.tsx`, `hex/intervals.ts`, `hud/Hud.tsx`). Sizes below are read from the PNGs. Not done: no run in a browser, no contrast tool.

## 1. Verdict
The empty state now sells itself (ghost, two buttons, live timeline), but the finished state loses the first 10 seconds: a small rainbow picture, a grey header the text says is explained, an empty HUD and no evidence lines. It is solid, not yet "beats all the other apps".

## 2. R-1 findings: really fixed?
| R-1 | Seen in screenshots | Verdict |
|---|---|---|
| F1 buttons | Empty shot: mint "Resurrect a sample" + ghost "Choose a file", 44 px, clear. | yes |
| F2 hex | 16 columns at 1440, dump look, bytes readable. Offsets and idle bytes still dim but legible. On phone the 16 columns run together with no gap (`0A05010800...`), unreadable. | partly |
| F3 glass depth | Panels now clearly lighter than page, L0 bytes visible at edges. Centre ambient glow is faint. | yes |
| F4 gutters | About 38 px gutters at 1440. Good. | yes |
| F5 empty HUD | Rings shown, "Appears after Resurrection" text. But after recovery the HUD stays empty beside a finished image (see N4). Pulsing not visible in a still. | partly |
| F6 timeline | Done mint dots, current ringed dot, mint label. On phone the six dots are tiny at top right, only "Resurrection" labelled. | yes (desktop), partly (phone) |
| F7 ghost | Ghost about 175 px wide, headline in 2 lines. Hero of the empty panel. | yes |
| F8 footer | Left line fine. Right credit still 2 lines, right-aligned, baseline not matching the left line, and it sits on L0 noise. | partly |
| F9 phone order | Image first, then bytes, region, HUD. Length 2157 px (aim 1500). | partly |
| F10 | Ruled out. | n/a |

## 3. New findings, ranked by first-10-seconds impact

**N1. Header bytes `000000-00007F` are grey, but the text says "a 128-byte header".** Where: BytesPanel, `t14-desktop.png` rows `000000` to `000070`. Target: every explained byte is mint, with outlined boxes round runs (rows `0001A0` to `0001D0`). Build: the first 8 rows (exactly 128 bytes, as the hypothesis states) use `--byte-idle`; mint starts at `000080`. So the text claims a header, the hex does not show it. Likely cause, to check (not confirmed): `BytesPanel.tsx` line 27 to 28 colours a byte only if its `elementId` is in `status` with `ok` or `uncertain`; the header element may have no `byteRanges`, no status entry, or a status other than `ok`. Also the 769-byte colour table at the end, which the text also names, is not visible in the window and must be checked at the end of the file. Fix: the worker prints, for this sample, each evidence `elementId`, `status` and `byteRanges`. If the header has evidence, fix the lookup. If the engine reports none, that is an engine gap: tell the conductor, do not paint it mint by guess. Either way every region named in the hypothesis text must be coloured, or the text must not name it. Task: T-15 evidence lines (check first, 10 min).

**N2. The recovered picture is small and the plate behind it clashes.** Where: `.image-stage`, `RecoveredCanvas`. Target: ghost about 360 px wide in a 720 px panel, a hero. Build: 222 px (2x) in a 375 x 350 box, so 41 percent of the width. The rainbow rings plus a slate-blue background plate (the picture's own background colour) sit on a one-accent mint design. Fix, keeping real pixels honest: (a) scale: whole numbers only, choose the largest integer that fits the box minus 24 px padding; at 1440 make the box taller (`min-height: 420px`) so the scale is 3x (333 px). Never use fractional scale. (b) Frame: put the canvas on a 1 px `--glass-border` frame with a 24 px `--sp-5` inset, a soft accent `drop-shadow(0 0 32px accent 18%)` behind the frame, not on the pixels; set `image-rendering: pixelated`. (c) Default sample: pick among the 11 tuning samples one with a mint-friendly or dark-background picture, or simply the one whose real colours sit best on `--bg-1`; the choice is a sample choice, not a recolour. Run all 11 through the screenshot and choose by eye, state the pick in the doc. Never filter, tint or remap the real pixels. Task: T-15 now (panel), choice of sample in `public/samples/index.json` default.

**N3. No evidence lines or outlined runs.** Where: between Bytes and Image. Target: mint and amber curves from outlined byte runs to image regions, the signature visual. Build: none, and no run outlines in the hex. At 1440 this is the biggest gap to the target. Fix: outline each explained run with a 1 px `--accent` at 55% border, `border-radius: 6px`, 4 px vertical padding; draw L3 SVG curves (1.5 px, `drop-shadow(0 0 6px accent 50%)`) from the run end to the image region it explains, amber for uncertain. Only draw for the selected hypothesis, max 3 lines. Task: T-15 evidence lines.

**N4. Empty HUD next to a finished image.** Where: `Hud.tsx`. Build: after "Recovered 111 by 111" the grid still says "0 regions" with 70 hollow rings, "no data", "0 mismatches" with "0 of unknown". It reads as a broken page. Target: lit grid, area chart, number. Fix, cheap and honest: show the per-row confidence the engine already reports (111 rows) as the real grid and chart as soon as `done`; `0 regions` must become the real count. For verification show "Check runs next" in `--muted` and hide the "0" and "0 of unknown" until T-17 gives a real number (a big grey 0 reads as a result). Task: T-17 HUD; T-15 now for hiding the false "0" and "0 regions" text.

**N5. Hypothesis text is a wall.** Where: image panel, below the frame. Build: 3 lines at `--fs-sm`, 44 words with six facts in one sentence. Fix: 1 line headline "Hypothesis 1 of 12" (accent, weight 600) + one short sentence (max 14 words, for example "128-byte header, 111 by 111 picture, run-length rows."), the rest in a `<details>` "Show the full reading" or in the inspector. Keep the plain-words rule (tested). Task: T-15 inspector.

**N6. Header title truncated.** Where: brand sub-line, `rings-rand-111x111.pcx, 5,480 bytes, a 111...`. Target: one clean line. Fix: show `name, 5,480 bytes` only and put "format unknown" or the recovered fact in the panel meta; or `max-width: 40ch` with a title attribute. Task: T-15 now.

**N7. Region card says "No region selected" with a finished run.** Where: bottom of the image column. Target: the card shows the best region (R-14, rule, bytes, confidence 0.96). Build: empty text, so the card is dead weight at the end of the run. Fix: pre-select the highest-confidence region when the run ends; the empty text stays for idle. Task: T-15 inspector.

**N8. Footer credit.** Where: `.foot`, right. Build: 2 lines at the right, offset from the left line by about 20 px in baseline, over L0 noise. Fix: `align-items: end`, credit `max-width: 64ch`, `text-align: right`, add `background: linear-gradient(transparent, var(--bg-0))` strip or lower L0 alpha under the footer. Task: T-15 now.

**N9. Phone: 16 columns with no gap, and 2157 px.** Where: `shell.css` lines 92 to 94 (`@container (max-width: 480px)`, `gap: 1px`). Build: bytes merge into a stream. Fix: below 480 px use 8 columns at `--fs-xs` with `--sp-2` gap (offsets stay), or 16 columns only with 2 px wide groups of 4 (a 4-byte group gap `--sp-2`). For length: collapse Confidence-by-row until data, put grid and verification in 2 columns (HUD task), show only 12 hex rows (not 17) inside a 220 px window. Target under 1500 px. Task: T-15 now (hex), T-17 (HUD).

**N10. Timeline on phone.** Where: top right at 390 px. Build: six 8 px dots with one label; looks like a bug at a glance, and the Speed pill sits under it on its own row. Fix: timeline full width under the brand, dots 10 px, current label centred under it; Speed pill 44 px high on the brand row, right. Task: T-16 ritual (the header layout), cheap markup fix T-15 now.

## 4. Keep list
- Empty state: ghost, two-line headline with mint "resurrect a sample", two buttons. Better than the target.
- Hex: 16-column dump at 1440, tabular numerals, container query on the panel, bottom fade, `--byte-idle` token.
- Mint explained bytes with soft glow (`.b.s2` text-shadow) read well.
- Timeline states with `aria-current`.
- Honest copy: "Reference picture loaded after recovery. The check itself runs in a later step." (but hide the false 0, N4).
- Real engine on a worker, 157.6 KB gzipped, 0 axe violations, 0 console errors.
- Glass panels with the inset top highlight, gutter clamp 24 to 48 px.

## 5. Rule breaks, with pointers
1. Hypothesis text names a header and a colour table that the hex does not colour: breaks the honesty rule that evidence is shown per element. See N1, `src/ui/panels/BytesPanel.tsx` lines 27 to 29 and `src/ui/describe.ts` line 6.
2. Big grey "0 mismatches" before any check: reads as a result. `src/ui/hud/Hud.tsx` line 37 (`<p className="big-num">0<small>mismatches so far</small></p>`). Show a result only when verification ran.
3. "0 regions" label while the engine has rows: `src/ui/hud/Hud.tsx` line 12 is hard-coded.
4. One accent: the recovered image is a rainbow. This is real engine output and stays unchanged; the rule is kept by framing and sample choice (N2), not by recolouring.
5. `@container (max-width: 480px)` block, `src/ui/shell.css` lines 92 to 94: `gap: 1px` is an ad-hoc value, not a token, and breaks readability on phone.

Skipped: no tool-measured contrast, no run in a browser, `src/ui/layers/` and the hypothesis-selection code were not read. Risk: N1 may be an engine fact, not a UI bug.
