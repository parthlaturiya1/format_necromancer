# J-2: Judge-panel review at Gate 3 readiness

Reviewer: judge-panel reviewer (J-2). I wrote none of this project. Report only. Date 2026-11-25 (night). HEAD 160cb87, 50 commits.

Read: judge-gap-review.md (J-1), README.md, AUTHORSHIP.md, LICENSE, docs/privacy.md, docs/security.md (top), wild-test.md, t20-polish.md, t19-golden-run.md (top), t18-failure.md (top), latest.md (top), build-journal.md, .kiro tree, the screens `t20-realart.png` and `t18-failure.png`, commit subjects.
Live site: fetched with HTTP only (status 200, 37.8 KB HTML, CSP header seen: `worker-src 'self'`, no `blob:` in workers, matches security.md H5). I did not run a browser. So I could not see the live pixels; visual findings come from the committed screenshots, not from the live deploy.
Not read in full: review-t13..t17, t21b/c/d, robustness-report, blind-test, specs text, design-target.png. Scores that lean on them are marked (thin).

## 1. Scores now (1 to 10) and change since J-1

| Criterion | J-1 | Now | Change | Reason |
|---|---|---|---|---|
| Potential Impact | 6 | **7** | +1 | 5 of 5 real CC0 Abuse PCX files exact, untuned, with source, licence, hashes (wild-test.md). Sourced scale numbers in README. Real art is in the app. Still one family, one source game, no user evidence. |
| Technological Implementation | 7 | **8** | +1 | verify green 11 of 11 with real budgets, CI badge, CSP tightened and checked on the live header, engine work limit, 2 IDE tasks, 3 specs, 7 steering, 2 agents, reviews R-1..R-5, signed commits. Held back by: hooks never fired, 820 provenance warnings, 4 known undetected breaks, ledger thin. |
| Design | 7 | **8** | +1 | Failure screen built and good (`t18-failure.png`). Real art looks striking (`t20-realart.png`). Grid shape, scale rule, phone pass done. Held back by visible edge bugs (section 4) and fps unproven on real GPU. |
| Innovation | 7 | **7** | 0 | Evidence-per-element, honest refusal, signature-changed recovery are good. Still "a PCX decoder with generic detectors in front". Related work is "UNKNOWN", which is honest but gives no contrast. |
| Presentation | 3 | **5** | +2 | README is now complete, honest and has a 30-second path. Still no video, no write-up, build-journal is test text (521 bytes), README opens on a bare URL. This is the cap on everything. |

Average now 7.0 (J-1 6.2).

## 2. Three best remaining actions per criterion (before Gate 3, Dec 2)

Points are my judgement on that criterion alone.

### Potential Impact (7)
1. Put the W-1 result in the README Results table and on the first screen ("5 of 5 real files, exact, untuned, CC0"). Effort S, +0.5.
2. Add a "your file" dry run in the video: drag a real Abuse PCX the audience never saw (the 3 not bundled). Effort S, +0.5. No engine change.
3. One honest "who uses this" line with a named, real case (e.g. a cited archive report on obsolete image formats), no invented numbers. Effort S, +0.5.

### Technological Implementation (8)
1. Write the Kiro story as one page: what each Kiro surface did, with a link to the commit. Include the two IDE tasks, the held-out guard turning verify red, T-10 fixture change, verifier finding 4 uncaught breaks. Effort S, +0.5. Fill `docs/build-journal.md`.
2. Close the 4 undetected breaks with detector-count assertions (tests only, verifier). Effort S to M, +0.5. Turns a disclosed weakness into a closed one.
3. Cut the 820 UNATTRIBUTED warnings to a readable summary: group them in `latest.md` by task and say why (reports, specs, tests). Do not edit the ledger. Effort S, +0.3.
Also useful: one real CI run screenshot (badge green) in the write-up. Effort S.

### Design (8)
1. Fix the edge bugs listed in section 4 (chips cut in the Bytes/Body card, "mismatches" touching the card edge, Verification buttons at the edge, title ellipsis). Effort S to M, +0.5 to +1.
2. Measure fps once on a real laptop with a GPU, and on one phone; put the number in README. Effort S (owner runs it), +0.3 and removes the biggest doubt.
3. Give the 320x200 art more room (it sits at 1x in a 376 px stage with empty space above and below, see `t20-realart.png`). Effort M, +0.5. Risk: T-18 shows a wider column broke the hex panel.

### Innovation (7)
1. Show the signature-changed file next to a standard decoder refusing it, in one frame (Pillow error text beside the engine's exact result). Effort S to M, +0.7. This is the clearest "no spec needed" moment.
2. Fill the Related work table with tested or documented facts (what Kaitai, ImHex, PolyFile need as input). Only claim what their docs state. Effort S, +0.5.
3. Rename the claim on screen to the narrow true one: "inferred layout, evidence per byte range". Already mostly there; make it the video's title card. Effort S, +0.3.

### Presentation (5)
1. Record the 3-minute video from `.kiro/steering/demo.md`. Effort L (owner), +3. Nothing else comes close.
2. Write-up with the Kiro-use answers, built from the ledger and git log. Effort M, +1.
3. README first screen: replace the bare URL line with title, one sentence, the live link, the screenshot, then 3 bullets of proof. Fill build-journal. Effort S, +0.7.

## 3. The first seconds

### Live site, first 10 seconds
The HTML shows "No file yet, format unknown", a hex wall of random bytes, and the button "Resurrect a sample". That is a good start: one obvious button. A judge must see, in order:
1. 0 to 2 s: the name, the dead bytes, one big button. (Present.)
2. 2 to 10 s: press, and the beats begin. The default sample is `rings-rand-111x111`, a synthetic image. It is the weakest first picture. Make the default the real game art (END.PCX with the figure), because that is the strongest image and a real file. Effort S, +0.5 Design, +0.5 Impact. Check the golden-run tests that name the default sample first.
3. By 13 s at 1x the result and "Exact match" show. The full ritual takes about 12.8 s (t19). That is long for a judge who skims. The Speed button exists; the first press should be at a speed that ends near 8 s, or the page should say "Skip to result" visibly during the run.
4. A one-line promise above the fold: "Recovers a dead file from its bytes alone. No spec. Nothing uploaded." The footer has it but it sits at the bottom, small.

### README, first 10 seconds
The file opens with a bare URL line, the title, a badge, the screenshot, then the creator line. Better order: title, one sentence of what it does, the link as a button-like line, the screenshot, then a 4-line proof list (5 of 5 real files exact, blind test exact, 297 mutations 0 wrong at >= 0.9, runs offline in the browser). Today the strongest result (W-1) is missing from the Results table.

### Video, first 15 seconds
In order:
1. 0 to 3 s: a real dead file nobody can open (a real Abuse PCX in a viewer or a decoder error), caption "Nothing opens this."
2. 3 to 8 s: drop it into the live site, no cuts, bytes visible.
3. 8 to 12 s: the reveal starts; the picture appears from bytes.
4. 12 to 15 s: "Exact match, 0 of 64,000 pixels differ" on screen with the words "no specification".
Do not open on a logo, a team slide or the Kiro explanation. Kiro comes at 1:30 to 2:30.

## 4. Anything that could make a judge doubt

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | README Limits says "The verify step for performance budgets is a stub", but the Results table row says Budgets are enforced (T-21c) and latest.md shows them PASS. Direct contradiction. | `README.md` "Limits." paragraph | Delete the stub sentence, or say only Lighthouse is missing. |
| 2 | README says Kiro IDE did "one task (T-11b)". T-21a (security self-review) was also done in the IDE. | `README.md` "How Kiro built it" | Say two. |
| 3 | README and AUTHORSHIP say 560 provenance warnings. latest.md says 820. | `README.md`, `AUTHORSHIP.md`, `docs/verification/latest.md` | Use one number, or write "see latest.md". |
| 4 | W-1 (5 of 5 real files) is not in the README Results table. A judge sees only synthetic proof there, then reads "does not prove real-world". The README undersells the best fact. | `README.md` Results and Limits | Add the row; reword Limits: blind-test generator caveat plus W-1. |
| 5 | AUTHORSHIP ledger summary lists tasks only up to T-13a/T-16. Later tasks are not listed. States "Later tasks may add lines". | `AUTHORSHIP.md` last table | Update or point to the ledger. |
| 6 | Hook claims. README is honest that hooks never fired. A judge scoring "variety of Kiro tools" will still see an unused feature. Keep the honesty; do not add a staged hook demo. | `README.md`, `AUTHORSHIP.md` | None needed beyond the video line. |
| 7 | Text and controls at card edges in the screenshots. In `t20-realart.png` "mismatches" ends at the Verification card's right edge, the progress bar and the Report (JSON) button run to the edge with no padding. In `t18-failure.png` the chip row in the Body card is cut ("Table record" clipped at the card edge) and the title shows "nothing..." with an ellipsis. T-20 says chips wrap (it fixed the inspector chips), so this screenshot may be older; recheck live. | `docs/verification/screens/t20-realart.png`, `t18-failure.png`, `src/ui` verification card | Run the same layout test on the Verification card and the Body chips at 1440x900 and 1280x720. |
| 8 | Frame rate. One real-art run fell to 30 fps p95; the README row is honest but a judge sees "headless only". | `README.md` Results, `t20-polish.md` | Measure on real hardware (S). |
| 9 | "Recovered without the format specification" is true for detection, but pixels come from a format-aware PCX decoder (disclosed). A judge may still call it a PCX decoder. | `README.md` honest claim | Keep the disclosure on screen near the result (it is in the footer; make it visible without scrolling in the video). |
| 10 | The W-1 truth is Pillow, and compare reads the engine's own PNG encoder output (disclosed in wild-test.md). Fine, but say Pillow in the README row. | `wild-test.md` | One phrase in the README. |
| 11 | Vision paragraph "meant to extend to other dead formats, not built yet". Honest. A judge will read "one format" as the main limit. | `README.md` Vision | Keep; do not promise DBF. |
| 12 | Duplicate "Created by" line at the top and bottom of README. | `README.md` | Harmless; remove one. |
| 13 | Scale numbers (104,000 museums, etc.) are upper bounds with sources named, but I did not open the sources. | `README.md` "Who it is for" | Add the links. |
| 14 | `docs/build-journal.md` is 521 bytes of test text, and AGENTS.md section C says to append at each session end. A judge opening it sees nothing. | `docs/build-journal.md` | Write real entries. |
| 15 | Regression gate: "four other deliberate breaks were not caught". Honest, but a visible hole. | `README.md` Results | Close it (action Technology 2). |

## 5. Would a second format (DBF) add more than polish and video?

No. Reasons:
1. The video is worth about +3 on Presentation. DBF is worth at most +1 on Impact and +1 on Innovation, and only if it works.
2. Time: Nov 25 night to Dec 2 is about 6 working days. DBF needs a second hypothesis family, its own decoder, truth source, corpus, UI states, tests, and a new verifier round. The engine's claim "generic detectors" would be tested hard. Failure on DBF would hurt more than absence.
3. Guardrail 9 from steering says a second format is cut before Gate 2. Gate 2 is passed on one format.
4. The already won evidence (5 of 5 real, blind, 297 mutations) is worth more than a thin second format.
Recommendation: keep one format. If time is spare after the video, add more real PCX variants (e.g. other palettes or sizes from Abuse) only as a read-only test, not a new family.

## 6. Top 8 actions by points per hour

| Rank | Action | Pts (sum over criteria) | Effort | Who |
|---|---|---|---|---|
| 1 | Record and edit the 3-minute video from demo.md | +3 | L (about 5 h) | owner |
| 2 | Fix README contradictions 1 to 5 and add the W-1 row | +1.5 | S (0.5 h) | worker |
| 3 | Reorder README first screen (one sentence, link, screenshot, 4 proof bullets) | +1 | S (0.5 h) | worker |
| 4 | Write build-journal and the Kiro-use write-up from git log and ledger | +1.5 | M (2 h) | worker |
| 5 | Default sample = real game art; speed so result lands by about 8 s or Skip is obvious | +1 | S (1 h) | designer |
| 6 | Fix card-edge overflow (section 4 item 7) and re-run at 2 widths | +0.7 | S (1 h) | designer |
| 7 | Side-by-side: standard decoder refuses signature-changed file, engine recovers it | +0.7 | M (2 h) | designer |
| 8 | fps on a real GPU laptop and a phone, put numbers in README | +0.5 | S (0.5 h) | owner |

Next: detector-count tests (+0.5), related-work facts (+0.5), more picture room (+0.5).

## 7. Honest ceilings by Dec 2

| Criterion | Ceiling | Why |
|---|---|---|
| Potential Impact | 8 | One format family, one source game, no user evidence. |
| Technological Implementation | 9 | IDE hooks never fired; a disclosed gap. 9 needs the story told well. |
| Design | 9 | A 10 needs real-device motion proof and zero edge bugs. |
| Innovation | 8 | Evidence-first and honest refusal are real. One family limits it. |
| Presentation | 9 | Depends fully on the owner's video and a clear write-up. |

Realistic total with the top 8 done: 8, 8.5, 8.5, 7.5, 8.5 (about 8.2). A 10 on all five is not honest to claim.

## 8. Biggest single risk

A judge opens the site, sees a synthetic ring picture, waits 12 seconds, and does not scroll to the real-file proof. Put the real file first, and put the real-file result in the first screen of the README and the first 15 seconds of the video.

Skipped or not checked: no browser run of the live site (HTTP fetch only); did not open the cited scale sources or review-t13..t17 in full; screenshots may predate later UI commits.
