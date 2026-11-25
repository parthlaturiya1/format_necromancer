# T-24b: README check

README claims against evidence at HEAD 2970013 (before this commit). "Backed" means a file or report shows it. "Removed" means the old wording was dropped.

| README claim | Evidence | Verdict |
|---|---|---|
| Button **Resurrect a sample** | `src/ui/panels/ImagePanel.tsx:256` | Backed |
| **Skip to result** jumps to the end | `src/ui/panels/ImagePanel.tsx:345` | Backed |
| Six steps | `src/ui/ritual/ritual.ts:6` (BEATS has 6 names), `src/ui/Shell.tsx:224` | Backed |
| Click a row of the picture selects a region | `src/ui/panels/ImagePanel.tsx:192-195` (pointer down calls `onPickRow`) | Backed |
| Click a Confidence Grid dot selects a row; each dot is one row | `src/ui/hud/Hud.tsx:75-87`; `docs/verification/t17-hud.md` (Confidence Grid) | Backed |
| Inspector shows rule and confidence | `docs/verification/t17-hud.md`, `screens/t17-done.png` | Backed |
| Badge **Exact match** | `src/ui/Shell.tsx:243` | Backed |
| Line "N of M pixels differ" (example "0 of 12,321") | `src/ui/Shell.tsx:255`; `t17-hud.md` default sample row | Backed |
| **Load the blind test** button in the Bytes panel | `src/ui/panels/BytesPanel.tsx:133` | Backed |
| Blind file never used for tuning | `src/ui/Shell.tsx:177`; `docs/verification/blind-test.md` | Backed |
| **Try a sample** picker; `corrupt-tail-cut`, `signature-changed` as options | `src/ui/panels/BytesPanel.tsx:127-130`; `public/samples/index.json` | Backed |
| Corrupted sample: "No picture was rebuilt" plus the reason, no guess | `docs/verification/t18-failure.md` (F-08 end to end); `src/ui/failure.test.ts` | Backed |
| `signature-changed`: standard decoder refuses, engine exact | `docs/verification/t18-failure.md` (bundled samples: 0 of 12,321 differ) | Backed |
| **Choose file**; no reference means nothing proves it correct | `src/ui/panels/BytesPanel.tsx:122`; `src/ui/Shell.tsx:265` | Backed |
| **Download image**, **Download evidence report** | `src/ui/hud/Hud.tsx:280-281` | Backed |
| **Reduce motion**, **Speed** controls | `src/ui/Shell.tsx:231`, `:264` | Backed |
| Frame rate p50 59.9 / p95 59.5 on 3 to 4.7 GB free; p95 15 to 20 fps on about 2 GB free | `docs/verification/t17-hud.md` (frame rate rows) | Backed |
| Measured headless Chromium, not real GPU or phone | `t17-hud.md` header and Not verified | Backed |
| Failure flow and "21 of 44 files" end unrecovered | `t18-failure.md` (bundled samples table) | Backed (number taken from that report, not re-run) |
| Signature sample exact, 0 of 12,321 | `t18-failure.md` | Backed |
| Reviews R-1 to R-5 and J-1 | `docs/verification/review-t13.md` to `review-t17.md` (titles R-1..R-5), `judge-gap-review.md` (title J-1) | Backed |
| Product image under the title | `docs/verification/screens/t17-done.png` exists | Backed |
| Vision: one layout family today; other formats not built | `docs/security.md`, `.kiro/steering/product.md` not re-read; claim is a statement of scope, PCX only as in "Format covered" | Backed (scope statement) |
| sessionStorage keys `fn.speed`, `fn.reduced` (privacy.md) | `src/ui/Shell.tsx:57-58`, `:76-79` | Backed |
| Old step 2 "Press Resurrect a sample" (R-5 not backed) | Button exists at ImagePanel.tsx:256 | Backed now |
| Old step 5 "Load the blind-test file" | Reworded to the exact button | Removed |
| Old "A damaged file ends as 'unrecovered'" | Reworded to what the screen shows | Removed |
| Old "Animation 59.9 fps median over 253 frames, 0 frames over 33 ms" | Replaced by the p50/p95 row | Removed |
| Old "review-t13 to review-t16" | Replaced by R-1 to R-5, J-1 | Removed |

Not verified: no browser run (the UI text comes from source and reports); the live link after deploy; the README anchor link used by the app footer.