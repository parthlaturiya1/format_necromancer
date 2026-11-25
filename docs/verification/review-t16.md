# R-4: design review of T-16 (the ritual vs the design target)

Reviewer: design only, wrote no code. Read: `docs/design-target.png`, `screens/t16-beat3.png`, `t16-beat5.png`, `t16-done.png`, `t16-phone-done.png` (viewed), samples `text-fire-160x32`, `shapes-rand-128x96`, `diag-ocean-256x16` (viewed; the other eight not opened), `t16-ritual.md`, `review-t15.md`, `design.md`, `demo.md`, and `src/ui/Shell.tsx` lines 165 to 190. Not done: no browser run, no video, no motion judged (stills only), `.kiro/specs/experience/requirements.md` not read. Motion claims below come from `t16-ritual.md`, not from my eyes.

## 1. Verdict
The ritual now tells the story in stills (grey file, three guesses, picture growing from rainbow arcs), but the Proof beat, the last 20 seconds a judge remembers, ends on an empty chart and a card that says "check runs in a later step", so the clip peaks at beat 5 and fades out.

## 2. R-3 findings: really fixed?
| R-3 | Seen in T-16 | Verdict |
|---|---|---|
| F1 line | 2 px, glow, caps at both ends, dashed row box, ends inside the row. But it leaves from the picked bytes in the middle of a row and runs across the hex text (see F2 below). | partly |
| F2 inspector | Rule one line, pill, chips wrap, nothing clipped. The one-line cut ends mid-sentence ("gives a...") which reads as a glitch. | yes |
| F3 right column | Grid is real and lit. Chart still empty at Proof (see F1 below). Overlap text fixed. | partly |
| F4 plate | Outer border gone. Slate-blue plate unchanged. | partly |
| F5 columns | Bytes and inspector, image panel, right column all end near y 780 to 800. | yes |
| F6 footer | One muted credit line, same baseline as the notice. Clean. | yes |
| F7 phone | Picture now first, chips in a row. Empty HUD cards still not hidden. Length not measured. | partly |
| F8 hex | Picked run boxed, the rest dims. In `t16-done` the whole window is still mint. | partly |
| F9 phone timeline | Full width, but only the current label shows. | partly |
| F10 accent | Labels white, mint on lines and bytes. | yes |

## 3. Findings, ranked by impact on a judge watching the 60-second ritual

**F1. The Proof beat has no proof.** Where: `t16-done.png` (Proof is lit in the timeline). Target: the chart filled with a glowing area, a big "0 mismatches", a segmented bar, the badge landing. Build: "Confidence by row: no data" with the note "fills in at the Proof step", on the Proof step. Verification says "Reference picture loaded after recovery. The check itself runs in a later step." The three HUD cards say "later" while the timeline says "now". Fix: at beat 6 draw the row-confidence area (111 real values, 1.5 px line, glow, fade fill), and show the real verification number once T-17 has it; until then hide the "fills in at Proof" copy (it is false). Task: T-17 HUD.

**F2. The evidence line crosses hex text.** Where: `t16-done.png` and `samples/text-fire-160x32.png`. Build: the line starts at the right end of the picked 7 bytes (x 285, mid-row) and runs through the rest of the same row ("EB 00 D9 81..." in rings, "1E FF 1E" in text-fire), so it strikes through readable bytes. In `t16-done` it also grazes the right ends of rows 0x60 and 0x70. Target: the line leaves the box's right edge, in clear space, then curves. Fix: start the path at the panel's right edge (x of the hex column end plus 8 px) at the row's y, with a short horizontal run-out inside the panel, and draw a thin connector (1 px, 40% opacity) from the picked box to that point only if the box is not the last one in the row. Or drop the line to a z-index below the hex text and fade its first 30 percent. Task: T-17 now.

**F3. Bug: bundled samples say "Your own file has no reference picture".** Where: `text-fire`, `shapes-rand`, `diag-ocean` at Proof (Verification card). Cause: `src/ui/Shell.tsx` lines 181 to 188. The message shows when `state.reference === 'none'` and `hasSample` is false. Only the default sample (rings) arrives with `reference` set to `loaded`. For the other three, `reference` stays `none`, so `Shell` treats a bundled sample as the user's own file. Not confirmed: whether the loader skips the reference for non-default samples, or `reference` is reset. Either way the owner will switch samples in the demo (0:15 to 0:35 hook, 1:35 proof) and sees a false line, and the verification story (demo.md golden run step 4) fails for them. Fix: set the reference when any bundled sample loads (find where `loadSample` takes an id). Task: T-17 now.

**F4. Text from L0 shows through the glass over readable text.** Where: `t16-beat3.png` ("90 88 6F E3 40" above "No region selected", "53 BE 27 36" over the legend "Uncertain", "52 00 2C 15" over the "0.5" label, "A5 A5 72 B4" inside Guess 2). `t16-beat5.png` same on the legend and chart. Target: noise sits behind panels and is almost invisible. Cause (inferred from `t16-ritual.md`): `backdrop-filter` is switched off while the ritual plays, so the panels stop blurring L0. The fix for frame rate removed the glass. Fix: while `data-ritual='playing'` raise the panel fill to about `rgba(11,13,20,0.92)` (solid, costs nothing) and drop L0 opacity under the panels. Task: T-17 now.

**F5. Beat 3 cards do not show the contest.** Where: `t16-beat3.png`. Build: Guess 1 at 1.00 is lit, Guesses 2 and 3 are identical in every word ("512-byte header, repeat runs", 0.40, same reason), so they read as a copy-paste. They sit in a dashed box inside the panel. No byte range is lit in the hex while guess 1 is on, so the cards and the bytes do not talk. Target (design.md beat 3): cards dim as detectors reject them, and hover lights ranges. Fix: show the 3 distinct guesses (if the engine only has two distinct ones, show two and say "10 more behind these"); light the 128-byte header range on the bytes when Guess 1 is focus by default; animate losers to 50% with the reason line fading in. Not confirmed: whether the engine returns distinct losers. Task: T-17 now (distinct text and default light), polish later (animation).

**F6. Beat 5 line does not follow the reveal.** Where: `t16-beat5.png` at 55%. Build: two lines land on the top rows (0 and 2), while the scan edge is at row 61. The picture itself is the best frame in the app (colour above a bright edge, grey ghost below). Target: the line is the thing that moves with the work. Fix: one line whose end tracks the scan row, its start at the bytes of that row (`y` changes with row); 20 ms per row already exists. Task: polish later (T-18 if free).

**F7. The picture is small in a tall empty panel.** Where: `text-fire` (a 320 px strip in a 560 px tall panel), `diag-ocean` (a thin bar), `shapes` (about 270 px). Target: the content fills about two thirds of its panel. Fix: scale to the largest whole multiple that fits the panel width (the rings sample is already 3x). For wide strips this means 4x or more. Task: polish later.

**F8. Confidence grid shape.** Where: all samples. Dot count equals row count (111, 32, 96, 16), correct and honest, 15 columns. Shapes: rings gives 7 full rows plus 6 dots, fine; `diag-ocean` gives 14 plus 2 (an orphan pair); text-fire three rows. The grid is all mint at the end because no row is uncertain, so it shows "all fine" and has no variety, unlike the target (126 dots, mixed amber and dim). Fix: pick columns so the last row has at least half the columns (for 16 rows use 8x2); keep honesty, do not fake amber. Task: polish later.

**F9. Phone.** Where: `t16-phone-done.png`. Build: title cut at "5,480 ...", timeline labels hidden except "Proof", the image comes first (good), then 16-column hex in tiny type with no groups. Fix: let the title wrap to two lines; on phone show a 4-group hex (as T-15 noted); hide the empty HUD cards. Task: T-17 HUD (cards), polish later (rest).

**F10. Inspector "Row 0" text is cut at "gives a...".** Where: `t16-done`, all samples. Fix: cut at a sentence end or a word plus "…" with the full text under "Show the full rule", and never end on a dangling article. Task: polish later.

## 4. Default sample: rings vs text-fire (and the rest)
| Sample | Opening shot (dead file) | Reveal drama | Other |
|---|---|---|---|
| rings-rand-111x111 | Plain grey hex, a 5.5 KB file. | Strongest: rainbow arches appear row by row from the top, grey ghost below, bright edge (see `t16-beat5.png`). 111 rows, 4.2 s. | Slate-blue plate is the dullest colour on screen. Verification works (reference loaded). Done shot: whole image is a target-like bullseye. |
| text-fire-160x32 | Same grey hex, 2 KB. | Weak while it plays: 32 rows is the minimum 3 s, and text only becomes readable in the last third. Payoff at the end is the best single frame: "FORMAT NECROMANCER" on dark red, melts into the UI. | Strip is small in a big panel. Verification card shows the false "no reference" text (F3). |
| shapes-rand-128x96 | Same. | Medium: shapes plus a green diagonal line. | The pale plate is harsh on the black UI. Same F3 bug. |
| diag-ocean-256x16 | Same. | Weak: a thin blue bar. | Orphan dots. |

Recommendation: keep rings-rand-111x111 as the default for the opening shot and the ritual. Reasons: (1) it is the only sample whose Proof step has a loaded reference today, so the golden run is whole; (2) its reveal shows a shape forming, which is what a judge can see from across a room; (3) 111 rows give a full 4 s beat 5 and 111 lit dots. Use text-fire as the second sample: the owner loads it at the demo's 0:15 to 0:35 hook or at the close, and the recovered picture spells the product name, which is a better last frame than a bullseye. That use needs F3 fixed first. If the owner wants a dark plate for rings, it is a corpus change (regenerate sample, golden numbers change), not a UI change, and should be a separate decision; not recommended before T-17.

## 5. Keep list
- Beat 5 frame (`t16-beat5.png`): colour above a bright scan edge, grey ghost below, grid lighting in step.
- Beat 3 as the second moment: three cards, the winner outlined, "12 layout guesses, ranked. The top three are shown."
- The picture frame at 3x with glow behind the frame, not on pixels.
- Wording: "Rows rebuilt 61 of 111", "Recovered without the format specification." in mint.
- Skip to result and Speed in plain view; one credit line.
- Dashed row box and 6 px caps on the evidence line.
- Phone: picture first, timeline full width.

## 6. Rule breaks, with pointers
1. Proof beat shows "later" copy while it is the current step: `src/ui/Shell.tsx` `verifyNote` (line 181 to 188), chart empty note in the HUD (`src/ui/hud/`, file not located).
2. `Shell.tsx` line 187: wrong message for bundled samples when `state.reference === 'none'` (F3).
3. Text over text (L0 through panels): `.app[data-ritual='playing'] .panel` in `src/ui/shell.css` (named in `t16-ritual.md`; line not located).
4. design.md "text never moves while being read" and "Hovering a card lights its byte ranges": no range lit by default in beat 3 (F5). Hover behaviour not checked.
5. design.md "Charts draw in at beat 6": not met (F1).
6. design.md Confidence Grid "Dim = unexplained": no dim dots seen in any sample, so the legend is not exercised. This is fine for honesty, but the amber and dim states have never been seen on screen, which `t16-ritual.md` already admits.

Skipped: motion, hover, contrast numbers, the other eight sample images, and the experience requirements file. Risk: pixel positions come from 1440x900 stills; the cause of F4 is inferred from the T-16 notes, not tested.
