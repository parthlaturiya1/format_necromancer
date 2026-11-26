# P-1 First impression polish

Source: docs/verification/judge-review-2.md (J-2) section 3, section 4 item 7, section 6 actions 5, 6, 7.
Agent: experience-designer. Checked with `npx playwright test` (one worker) and `npm run verify` once at the end: **PASS** (docs/verification/latest.md).

## Results

| Item | What changed | Evidence |
|---|---|---|
| 1 Default sample | `DEFAULT_ID = 'real-abuse-end'` in scripts/samples/copy-samples.mjs; public/samples/index.json `default` | Golden run 4 of 4 green on 320x200 real art, "0 of 64,000 pixels differ"; F-01 speed test ratio 0.266 (4x 3312 ms vs 1x 12454 ms); tests read the value from index.json (tests/e2e/sample.ts `DEFAULT`) |
| 2 First run timing | First press plays at 2x (pill "Speed 2x"); 1x is 3 presses away and the choice stays for the session. "Skip to result" is now a filled accent button, shown during every run (full and reduced motion) | Press to finished: **7.6 to 8.0 s** (p1.spec 7710, 7775, 8019 ms; golden run 7649 ms desktop, 7748 ms phone). All six beats play. Beat timings unchanged |
| 3 Promise line | Subtitle under the title: "Recovers a dead file from its bytes alone. No specification. Nothing uploaded." Footer line kept | p1.spec checks exact text, position under h1, above 900 px; p1-first.png |
| 4 Card-edge overflow | Card children may shrink and wrap (min-width 0, max-width 100%, overflow-wrap), Verification top row wraps, sample buttons wrap, download labels wrap | New check in tests/e2e/p1.spec.ts: every text node, button, bar, badge and link inside each `.panel` lies inside the card's content box (padding excluded). 9 of 9 green: real-abuse-end, corrupt-tail-cut (failure), signature-changed at 1440x900, 1280x800, 390x844. Before the fix it failed at 1280x800 ("Try real game art" 17 px past) and 390x844 ("Waiting for a file" 5 px past) |
| 5 Refuses vs recovers | Panel under the picture for signature-changed: "A standard decoder: refuses this file" vs "Format Necromancer: recovered, exact" | Text recorded at build time by copy-samples.mjs running Pillow on the exact file: `UnidentifiedImageError: cannot identify image file 'signature-changed.pcx'`, source "Pillow 13.0.0, a widely used image library". Stored in index.json (`refusal`, `refusalSource`); without Python the committed text is kept. p1.spec checks the panel shows the stored text, and is absent on the default sample; p1-signature.png |

## Kept

| Check | Result |
|---|---|
| axe serious/critical | 0 (golden run, 5 states x 4 runs) |
| Console errors | 0 |
| Foreign requests | 0 |
| JS landing | 202,161 bytes gz (limit 250,000) |
| Phone page height, default, done | 1490 px (limit 1500) |
| Beat-5 fps p95, real-abuse-end at 1x | **29.9 to 30** in this session's runs (p50 16.7 ms, 7 to 11 frames over 33 ms); rings-rand 59.5. Free memory 4.7 to 5.0 GB |

## Not verified / weakest point

- **Beat-5 fps 55+ p95 on the new default is not met here.** p95 sits at 33 ms because 7 to 11 of about 165 frames take two vsyncs; p50 is a full 60 fps. T-20 measured the same file at 30 / 59.5 / 59.5 (t20-polish.md). The canvas repaint per frame was not changed in this task. Next: paint only the newly revealed rows instead of the whole 320x200 picture each frame.
- The fps test is "numbers, not a gate", so verify stays green with this miss.
- Live site not checked: nothing is pushed.
- One fix outside the five items: BytesPanel now renders the scrolled-to rows in the same frame as a selection (it waited one frame for onScroll). The keyboard grid test and golden run exposed this only on the new default, whose row 2 bytes are off screen.

## Screens

- screens/p1-first.png: 1440x900 at 0 s, before pressing
- screens/p1-done.png: finished, real art
- screens/p1-signature.png: refuses vs recovers panel
- screens/p1-phone.png: 390x844 full page, finished
