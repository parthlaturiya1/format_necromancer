# T-14 verification: panels, file input, bundled samples

Run 2026-11-25, Chromium via Playwright against the built `out/`. Tests: `tests/e2e/panels.spec.ts` (5), `src/ui/ui.test.ts` (4 unit). All e2e (12 of 12) pass.

## Results
| Check | Result |
|---|---|
| Samples | `npm run samples` (also `prebuild`) copies the 11 tuning samples and reference PNGs to `public/samples/` (49,895 bytes) with `index.json`. Held-out never listed or opened. Default: `rings-rand-111x111` |
| "Resurrect a sample" | real worker run, canvas 111x111 shows the rings, "Rows rebuilt 111 of 111", "Hypothesis 1 of 12: The file holds a 128-byte header, a picture 111 wide and 111 tall, rows of 112 values, repeat runs marked by mask 192, a 769-byte colour table at the end." |
| Reference PNG | not requested before recovery (asserted); fetched after recovery for the sample only. UI says the check runs later (T-17) |
| File input | "Choose file" (Bytes) and "Choose a file" (image) open the picker, drop works on the stage, all reachable with Tab (tested). A file over 10 MB gives "That file is 10.0 MB. The limit is 10 MB. Nothing was read." No upload code exists |
| Hex, 1 MB random file | 65,536 rows, **max 30 rows in the DOM**, 240 scroll steps top to bottom, last row `0FFFF0` reached. Long tasks over 50 ms: **0** (observer saw 0 tasks). Frame time while scrolling: p95 25.5 ms, max 41.5 ms (headless, software rendering, engine running in the worker at the same time) |
| Byte colours | from an interval index built once from evidence (explained mint, uncertain amber, unexplained `--byte-idle`). Unit-tested merge and lookup |
| axe 1440x900 and 390x844, after the sample loads | 0 violations. Also 0 on empty, phone, 404 (shell test) |
| Console errors / other-origin requests | 0 / 0 |
| Initial JS gzipped | **161,413 bytes = 157.6 KB** (all `.js` responses incl. the engine worker). Budget 250 KB. It was 82.5 KB at T-13: the real engine now ships. Probe and run share one worker (one `new Worker` site; two sites doubled the chunk) |
| Unit tests | reducer idle to done and ignored out-of-order actions; interval index; plain-words rule |

Screens: `screens/t14-desktop.png` (1440x900, sample loaded), `screens/t14-phone.png` (390 wide, full page, 2157 px tall), `screens/t14-empty-desktop.png`.

## Review R-1 findings (`review-t13.md`)
| Finding | Status |
|---|---|
| F1 empty-state buttons | done: "Resurrect a sample" (primary) and "Choose a file", 44 px, drag-over highlight. Wired to the real flow |
| F2 hex 16 columns, 480 px breakpoint, `--byte-idle`, offsets 0.7 | done. Below 480 px the 16 columns stay, packed with no gap at 12 px |
| F3 panel fill 9%, stronger L0, one ambient radial | done (L0 alpha 0.10 to 0.22) |
| F4 gutters clamp 24-48 px, header spacing, HUD gap | done |
| F5 empty-state HUD (5x14 dots, pulses in turn, chart text, accent bar) | done. Filled-state: deferred to T-17 |
| F6 timeline done/current/todo, `aria-current`, phone label | done, and it moves with state (idle 0, reading 1, done 4). Full driving by beats: deferred to T-16 |
| F7 bigger ghost, 2-line headline | done (ghost capped by viewport height so it never touches the headline) |
| F8 footer alignment | done. Mint line on completion: deferred to T-16 |
| F9 phone order image, bytes, region, HUD | done. HUD grouping (2 columns, hide empty chart): deferred to T-17. Phone page is 2157 px, over the 1500 px aim until then |
| F10 title scale | not changed, as ruled |
| Rule break 2 tokens, chart text 12 px | done: `--dot-size`, `--bar-h`, `--logo-size`, `--tl-dot`, `--tl-dot-now`, `--fs-stat`, `--row-h`, `--tap`. Chart text 12 px at viewBox scale 1 or more |
| Rule break 4 box-shadow in transition | done: glow is an opacity-only pseudo-element |

## Choices and limits
- `public/samples/` is committed. `scripts/verify.mjs` runs `next build` directly, so `prebuild` would not run there.
- No new dependency.
- Image scales by whole numbers only (crisp), so a 111 px picture shows at 2x (222 px) in a 330 px box. Larger boxes get larger steps.
- shortcut: the hex window re-renders on a rAF after scroll; a fast fling can show blank rows for one frame. Upgrade if seen on slow devices.
- Hex uses one binary search per visible row, then a walk. Memory is the segment list, not one entry per byte.

## Not verified
- Real device scroll feel, Safari, Firefox, DPR 2 canvas sharpness (code caps DPR at 2, not tested at DPR 2).
- Engine time on a 10 MB file. The 1 MB file is random noise, so the engine returned unrecovered quickly.
- Reference decode and comparison (T-17). Ritual beats (T-16).

## Weakest point
The recovered picture appears at once; there is no build-up yet, so the signature moment depends on T-16. The phone page is still long.
