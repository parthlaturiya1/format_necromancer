# T-20 Depth polish (R-5 leftovers) and real CC0 game-art samples

Agent: experience-designer. Base `e5819ef` (T-21b and T-21c landed in parallel; none of their files touched). Headless Chromium, one Playwright worker, built static export.
**Three.js is dropped.** The owner accepted depth polish instead ("Do T-20 depth polish, skip Three.js"). No 3D code, no new dependency.

## Result in numbers
| Check | Result |
|---|---|
| New e2e `tests/e2e/t20.spec.ts` | 10 of 10 (2 real-art, picker, layout D1/D2/D3/D7/chips, phone D9, failure guesses, 2 frame-rate runs) |
| New unit test `src/ui/hud/grid.test.ts` | 2 of 2 (200 rows give 20 columns; no-rectangle counts keep the last row at least half full) |
| Targeted e2e run hud, inspector, t18, t20 | 36 of 36 passed |
| Real art `real-abuse-end` (320x200) | Exact match, 0 of 64,000 pixels differ |
| Real art `real-abuse-credit` (320x200) | Exact match, 0 of 64,000 pixels differ |
| axe serious/critical, real-art screens | 0 |
| Console errors, other-origin requests (real-art runs) | 0, 0 (the OpenGameArt link is never fetched) |
| Phone page height, 390x844, default sample (limit 1500) | 1495 px |
| Landing JS, all `out/**/*.js` gzipped (limit 250 KB) | 214,466 B (own measure; the budget step in verify measures landing JS only) |

Beat 5 frame rate at 1x, 1440x900 (`t20.spec.ts`, three runs each; free memory read with `os.freemem()` before and after):
| Sample | Frames | p50 ms | p95 ms | fps p95 | Frames over 33 ms | Free memory |
|---|---|---|---|---|---|---|
| rings-rand-111x111, run 1 | 247 | 16.7 | 16.8 | 59.5 | 2 | 4.3 to 4.2 GB |
| rings-rand-111x111, run 2 | 251 | 16.7 | 16.7 | 59.9 | 0 | 4.2 to 4.0 GB |
| rings-rand-111x111, run 3 | 249 | 16.7 | 16.8 | 59.5 | 1 | 4.3 to 4.1 GB |
| real-abuse-end, run 1 | 340 | 16.7 | 33.3 | **30.0** | 6 | 4.4 to 4.0 GB |
| real-abuse-end, run 2 | 348 | 16.7 | 16.8 | 59.5 | 4 | 4.1 to 4.0 GB |
| real-abuse-end, run 3 | 352 | 16.7 | 16.8 | 59.5 | 5 | 4.2 to 4.0 GB |

The 320x200 picture holds 59.5 fps p95 in 2 of 3 runs; one run fell to 30 (6 frames over 33 ms out of 340, enough to tip p95). An earlier run on 3.5 GB free also gave 59.5.

## Real game-art samples
Rendered all five files in `corpus/wild/` (Pillow references in `docs/verification/wild/`). `ant-ant` and `exp1-fire0005` are a tiny sprite on black; `consfnt-fnt5x7` is a font sheet. Picked the two that read best:
| Id in app | Source in zip | Bytes | sha256 (checked against `corpus/wild/manifest.json`) |
|---|---|---|---|
| `real-abuse-end` | `endgame/END.PCX` | 49,047 | `ec00b4b7...ec90` |
| `real-abuse-credit` | `credit/CREDIT.PCX` | 83,207 | `7d4f8444...710a` |

- `scripts/samples/copy-samples.mjs` copies each file byte for byte only after its sha256 and size match the manifest, else the build stops. The reference is Pillow's decode, fetched only after recovery, like every other sample.
- Picker label: "Real game art (CC0): end" and "Real game art (CC0): credit". Direct button "Try real game art" next to "Load the blind test".
- On screen: pill "Real game art (CC0)" in the Verification card; under the picture "From the game Abuse by Crack dot Com, CC0, via OpenGameArt." with a link "Abuse art on OpenGameArt" to https://opengameart.org/content/abuse-art (`target="_blank"`, `rel="noopener noreferrer"`).
- **No year is shown.** `docs/verification/wild-test.md` records only the page's posting date (2010-06-18) and no release year for the game, so the year is left out.

## R-5 items
| Item | Status | Measured |
|---|---|---|
| D1 picture scale | Done for the rule (largest whole multiple). Rings 3x (333 px), 320x200 real art 1x (320 px in a 376 px stage: 2x needs 676 px). | `t20.spec` checks width is a multiple of 111 and fills over 80 percent of the stage width. The 320 px art fills 85 percent of the width; height share is lower (200 of 376 px). Not "two thirds of the panel" by height at 900 px high. |
| D2 hex rows | Partly. Row height 22 to 20 px; 11 to 12 full rows visible at 1440x900 (plus two faded half rows). Soft 30 px fade at the bottom, 20 px at the top once scrolled; hard clip gone. | Not 20: the column at 900 px high has room for the inspector card below it. |
| D3 charts | Done. Plot 120 px tall (7.5rem) on desktop and phone (phone 80 px: 5rem, to keep the page under 1500). | `t20.spec` asserts >= 120 px at 1440x900. |
| D6 downloads | Done. "Image (PNG)" and "Report (JSON)", one line each, 16 px inline-SVG icons (no library), side by side and equal size on desktop, full width stacked on phone. Accessible names "Download image (PNG)" and "Download evidence report (JSON)". | |
| D7 grid columns | Done. `gridCols` (in `src/ui/hud/stats.ts`): widest exact rectangle of 10 to 20 columns, else up to 16 with the last row at least half full. 200 rows: 20 by 10. 111 rows: 16 columns, last row 15 of 16. Dots scale to the card width. | `t20.spec` counts 20 columns on 200 rows. |
| D9 phone | Done. Title wraps to 2 lines (no ellipsis), hex bytes grouped in fours with a gap, downloads full width, sample picker full width, page 1495 px. | Picture stays 1x on phone (see weakest point). |
| D10 picker | Done. Pill select matching the tokens (glass fill, border, 32 px, pill radius, accent border on hover), same height as the two buttons beside it. | |
| Chips | Done. Inspector chips wrap to a second line; none cut at the right edge (test checks every chip's right edge). Confidence pill moved beside the card title to pay for the line. | |
| Failure guesses | Done. The failure list drops guesses that read the same (same layout words and reason), shows up to 3, then "N more like these". `corrupt-tail-cut`: 3 distinct guesses, "9 more like these". | `t20.spec` checks the shown lines differ. |

## Screens
- `screens/t20-done.png` (1440x900, default sample, Proof)
- `screens/t20-realart.png` (1440x900, `real-abuse-end`), `screens/t20-realart-credit.png`
- `screens/t20-phone.png` (390x844, full page, 1495 px)
- `screens/t20-failure.png` (1440x900, `corrupt-tail-cut`)

## Not verified
- Contrast numbers of the new pill select and source line (axe passed).
- The source link opening a tab in a real browser (attributes checked only).
- Frame rate on a real GPU; headless numbers only.

## Weakest point
320x200 art stays at 1x on desktop (the middle column is 376 px; 2x needs 676) and shrinks below 1x on phone (274 px wide). The picture reads, but it does not fill two thirds of the panel height. A wider middle column broke the hex panel in T-18.
