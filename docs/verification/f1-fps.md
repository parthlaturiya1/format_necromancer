# F-1: beat-5 frame rate on real art

Bar (D-10): beat-5 p95 frame interval at 55 fps or better (18.2 ms or less), at 1x and 2x, on real-abuse-end (320x200, 200 rows), rings-rand-111x111 and real-abuse-credit (320x200), 3 runs each.

Method: `tests/e2e/f1-fps.spec.ts` (opt-in: `F1_FPS=1 npx playwright test f1-fps`, `F1_GATE=1` makes 55 fps a failure). Headless Chromium from Playwright, one worker, 1440x900, `?demo=1&speed=S&sample=ID`. A rAF loop records every frame interval while `.app[data-beat="5"]`. p95 is the 95th-percentile interval; fps_p95 = 1000 / p95. Machine: Windows, 12 logical CPUs. Free memory is read with `os.freemem()` before each run.

## Before and after

Before = HEAD 671dfeb. After = this commit. Numbers are fps_p95 for runs 1 / 2 / 3, then frames over 33 ms per run.

| Sample | Speed | Before fps_p95 | Before over 33 ms | After fps_p95 | After over 33 ms | Free memory after |
|---|---|---|---|---|---|---|
| real-abuse-end | 1x | 30 / 30 / 30 (P-1 report, 29.9 to 30) | 7 to 11 | 59.5 / 59.5 / 59.5 | 1 / 2 / 0 | 4.8 to 5.1 GB |
| rings-rand-111x111 | 1x | 59.5 (P-1, T-20) | 0 to 3 | 29.9 / 59.5 / 59.5, rerun 59.5 / 59.5 / 59.9 | 18 / 1 / 1, rerun 0 / 0 / 1 | 5.0 to 5.3 GB |
| real-abuse-credit | 1x | not measured before | | 59.5 / 59.5 / 59.9 | 0 / 6 / 2 | 5.1 GB |
| real-abuse-end | 2x | not measured before | | 59.5 / 59.5 / 59.9 | 2 / 3 / 2 | 5.0 to 5.1 GB |
| rings-rand-111x111 | 2x | not measured before | | 59.9 / 59.9 / 59.5 | 0 / 0 / 0 | 5.1 GB |
| real-abuse-credit | 2x | not measured before | | 59.5 / 59.5 / 59.5 | 1 / 2 / 0 | 5.0 GB |

20 of 21 after-runs meet 55 fps. The one miss (rings-rand 1x, run 1: 206 frames instead of about 250, 18 slow) came while the machine was loaded by other work; the 3 reruns straight after were 59.5 / 59.5 / 59.9. Mid-task, with other processes busy, the old code fell to 10 to 20 fps on the same files; the A/B below was run in that state too, which made the costs easy to see.

## The cause

A/B with a CSS override injected after load (test-only, `page.addStyleTag`, nothing shipped), real-abuse-end at 1x. "slow" = intervals over 25 ms out of about 330 to 360.

| Variant | p95 ms | slow frames |
|---|---|---|
| base (canvas already drawing only new rows) | 33.4 | 21 to 30 |
| L0 drift hidden | 33.4 | 41 (loaded machine; base was 110 then) |
| dot glow (box-shadow) removed | 33.3 | 22 |
| frame glow removed | 33.3 to 83 | no change against base |
| L3 lines hidden | 33.4 to 100 | no change against base |
| all CSS filters off | 33.2 to 100 | no change against base |
| grid hidden + canvas on its own layer | 16.7 | 0 to 2 |
| grid hidden only | 33.3 | 23 |
| canvas own layer only | 33.3 | 24 |

Long-animation-frame entries for the slow frames showed no script and about 4 ms of rendering on the main thread: the time went to the compositor. Slow frames came every 32 frames (about 0.53 s), which is one grid row of 18 dots.

1. The confidence grid. Beat 5 gave each of the 200 dots its own CSS animation with a delay (`animation-delay: var(--d)`, fill `both`). All 200 were live for the whole beat, so Chromium kept 200 animated layers and rebuilt them as each grid row finished. This was the main cost. It scales with row count, which is why 111-row rings-rand was fine and 200-row art was not.
2. The L0 byte drift redrew a full-window canvas every 33 ms under everything during beat 5.
3. The picture canvas shared a layer with its frame and glow, so each redraw repainted them as well.
4. The canvas redrew the whole 320x200 picture (grey plus colour) every frame.

## The fix

- `src/ui/hud/Hud.tsx`, `src/ui/shell.css`: one rAF loop marks each dot `on` when its row's time comes; a 300 ms opacity and scale transition fades it in. Only the few dots fading at that moment animate. Same order, same timing (row i at i/n of beat 5), same fade and pop.
- `src/ui/layers/L0Field.tsx`, `src/ui/Shell.tsx`: L0 holds its current frame while beat 5 plays (`paused`) and resumes after, without a new layout, so the bytes do not jump.
- `src/ui/shell.css`: `.recovered` gets `will-change: transform`, its own layer.
- `src/ui/panels/ImagePanel.tsx`: each frame redraws only the rows the last frame marked (scan edge, amber flicker) plus the new rows; a resize, a hold or a step back draws the whole picture. The progress text updates only when the row count changes.

Nothing in beat 5 was dropped: grey picture, colour rows top to bottom, scan edge, amber flicker on uncertain rows, row counter and bar, grid lighting in order, L3 lines.

## Checks after the fix

`npm run verify`: PASS. Golden run green at 1440x900 and 390x844, full and reduced motion; axe 0 violations on every screen; console errors 0; foreign requests 0; F-01 tests (six beats in order, 4x about a quarter of 1x) green; initial JS 175,773 bytes gzipped in the shell test, landing 202,441 bytes (limit 250,000).

Not verified: real Chrome on other machines, GPUs or high-DPR screens; Firefox and Safari; 0.5x and 4x speeds.
