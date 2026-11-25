# T-19: golden run, accessibility, zero network (verifier)

Verifier session. I wrote no code under src/, scripts/, public/ or .kiro/. Date 2026-11-25. Repo HEAD 8bea62c (main, equal to origin/main when fetched). Build: `npm run build` at HEAD, served from out/ by scripts/serve.mjs. Node v26.13.1, Playwright 1.65.1 chromium, axe-core 4.14.1.

**Verdict: PASS** for R-12 on the local build and on the live URL. The UI deliberate break was caught.

New files: `tests/e2e/golden-run.spec.ts` (5 tests), `tests/e2e/live.config.ts` (same test against any URL), this report, `docs/feature-register.md`.
Run: local `npx playwright test golden-run`. Live `BASE_URL=https://format-necromancer.vercel.app T19_OUT=live npx playwright test -c tests/e2e/live.config.ts`.

## 1. Golden run (demo.md A), local build out/

Default sample: `rings-rand-111x111` (111 rows). Real speed (1x), not the 4x test speed. Chromium, clean context each test.

| Check | 1440x900 full | 390x844 full | 1440x900 reduced | 390x844 reduced |
|---|---|---|---|---|
| Start button visible (step 1, limit 10 s) | 0.31 s | 0.30 s | 0.31 s | 0.29 s |
| Dead bytes on screen before press | yes | yes | yes | yes |
| Beats seen, in order | 1,2,3,4,5,6 | 1,2,3,4,5,6 | 1..6 (stepped with Next beat) | 1..6 |
| Beat 1 to beat 6 | 10.65 s | 10.68 s | n/a (user paced) | n/a |
| Press to finished | 12.97 s | 12.79 s | 1.50 s (Next beat x5) | 1.44 s |
| Grid dots / uncertain dots | 111 / 0 | 111 / 0 | 111 / 0 | 111 / 0 |
| Row click: rule + confidence + lit bytes | yes, 15 bytes | yes, 256 bytes | yes, 15 | yes, 15 |
| Line from bytes to row | drawn | none (by design on phone, highlight only) | drawn | none (same) |
| Verification | Exact match, 0 mismatches, 0 of 12,321 pixels differ | same | same | same |
| Blind-test file (button "Load the blind test") | badge "Blind test", label "Held-out file, never used for tuning.", Exact, 0 of 13,500 differ | same | same | same |
| Corrupted sample `corrupt-tail-cut` | Nothing recovered, no picture, step "Resurrection" in rgb(255, 92, 108), reason "The best hypothesis has no size numbers, so the picture size is unknown.", no crash, good sample loads again after | same | same | same |
| axe serious/critical (5 states: idle, done, row selected, blind, failure) | 0 of 5 states; 0 violations of any impact | 0; 0 | 0; 0 | 0; 0 |
| Console errors | 0 | 0 | 0 | 0 |
| Requests to other origins | 0 | 0 | 0 | 0 |

Step 6 comparison (test 5): reduced motion equals full motion on badge, pixels-differ text, blind result, grid size and states, "Rows rebuilt 111 of 111", recovered canvas pixels (same data URL) and failure reason, at both sizes. PASS.

### Network during analysis
After the start press, the only requests were exactly three, all same origin (local run 1440 full):

| ms after press | Request |
|---|---|
| 117 | /samples/index.json |
| 154 | /samples/rings-rand-111x111.pcx |
| 216 | /samples/rings-rand-111x111.png (reference, after recovery) |

The test fails on any other URL, any second .pcx or .png, or a .png before the .pcx. Between the reference fetch and beat 6 (about 12 s) there was no request. Shape of the claim: "no network during analysis" holds in the sense that nothing is sent anywhere and nothing is fetched after the reference PNG. The sample bytes are fetched at the press (same origin), because that is how a bundled sample is read.

## 2. Deliberate UI break (testing.md 8.3, Gate 2)

- Branch `break/t19-ui` from main 8bea62c. One-line change in `src/ui/layers/L3Evidence.tsx`: `{g.line && d ? (` became `{g.line && d && g.rows.length < 0 ? (` so the evidence line (the L3 curve) is never drawn. (First attempt, `false && g.line`, failed typecheck, so the build did not update. That run was invalid and I discarded it.)
- Rebuilt, then ran `golden-run` at 1440x900 full motion. Result: FAIL, caught:

```
Error: expect(locator).toHaveCount(expected) failed
Locator:  locator('[data-testid="evidence-line"] path.l3-line')
Expected: 1
Received: 0
> 152 |  await expect(page.locator('[data-testid="evidence-line"] path.l3-line')).toHaveCount(1);
1 failed  tests\e2e\golden-run.spec.ts:62:5 › golden run 1440x900 full motion
```
- Restored the file, `git checkout main`, `git branch -D break/t19-ui`. After: `git branch` shows only main and backup-before-email-rewrite; `git diff HEAD --stat -- src` empty; `git status` shows only my files. out/ rebuilt from main.
- Limit: the break is only caught at desktop size, where the line exists. On a phone there is no line, by design.

## 3. Live URL https://format-necromancer.vercel.app

Same 5 tests, clean context, from this machine (India). 5 passed, 2.0 min. Values identical to local: 111 rows, Exact, 0 of 12,321 and 0 of 13,500, same canvas data URL length, axe 0 violations at both sizes in all 5 states, 0 console errors, 0 cross-origin requests, same 3 requests after the press.

| Step | 1440 full | 390 full | 1440 reduced | 390 reduced |
|---|---|---|---|---|
| Start button visible | 3.88 s (cold, first load of the run) | 0.51 s | 0.53 s | 0.48 s |
| Beat 1 to beat 6 | 10.85 s | 10.72 s | n/a | n/a |
| Press to finished | 13.59 s | 13.07 s | 1.73 s | 1.56 s |
| Steps 1 to 6 | pass | pass | pass | pass |

Which commit does live serve? Not detectable by id: the HTML has no build id, and the chunk file names (`_next/static/immutable/chunks/...`) share none of the 12 names in my local out/ (`_next/static/chunks/...`). Evidence it is current: `Last-Modified: Wed, 25 Nov 2026 14:11:35 GMT` (19:41 IST), after HEAD 8bea62c at 19:32 IST; `/samples/signature-changed.pcx` returns 200 (T-18 sample); `corrupt-tail-cut` is in its picker; its recovered picture is byte-identical to the local one. I conclude: serves main at or after T-18. Exact commit UNKNOWN.

Live response headers on `/` (from `curl -I`): HTTP 200; Content-Security-Policy `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`; X-Frame-Options DENY; X-Content-Type-Options nosniff; Referrer-Policy no-referrer; Permissions-Policy camera=(), microphone=(), geolocation=(); Strict-Transport-Security max-age=63072000; includeSubDomains; preload. These match vercel.json. The CSP did not block anything: 0 console errors under it, workers ran.

The local server (scripts/serve.mjs) sends no security headers, so the local run proves behaviour, not the CSP. The live run proves both.

## 4. README "Try it in 30 seconds" (read only, README at 8bea62c)

| Step | Live | Local |
|---|---|---|
| 1 Open URL, no login | ok | n/a |
| 2 "Resurrect a sample" | button text matches exactly; picture appears | same |
| 3 Click a row: bytes light, rule, confidence | ok at desktop and phone | same |
| 4 Verification panel vs reference | Exact match, 0 mismatches | same |
| 5 "Load the blind-test file" | Mismatch in wording: the button reads "Load the blind test" (src/ui/panels/FilePick.tsx), and the README says "file". Minor. It loads, is labelled, and is exact. | same |

Other README numbers I checked: "59.9 fps median over 253 frames, 0 frames over 33 ms" matches docs/verification/t16-fps.json. README says `latest.md` lists 560 UNATTRIBUTED warnings: not recounted. Not checked: the other README claims.

## 5. R-12 and other status

- R-12 (accessibility checks pass): PASS on local build and live. axe 4.14.1, 0 violations (not only 0 serious/critical) in 5 states at 2 sizes, in both motion modes, 20 axe runs per environment. Also existing: shell.spec.ts axe on desktop, phone, 404; inspector.spec.ts keyboard-only path; t18.spec.ts axe on failure. Limit: axe finds about a third of accessibility issues. No screen reader run and no manual contrast or zoom check by me.
- Other e2e (full suite except golden-run, once): 45 passed, 5 skipped (SHOTS-only), 0 failed.
- I did not run `npm run verify` (not required for this task).

## 6. Not tested

- Uncertain (amber) rows in the golden sample: the default sample has 0 uncertain rows, so the amber flicker in beat 5 was not seen in the golden run. t18.spec.ts covers amber dots on `changed-lower-confidence` (not the flicker).
- Beat 5 flicker and glow visuals: only assertions on structure, not looks. Screenshots were not taken (SHOTS off).
- Real phone hardware, Safari, Firefox. Only Chromium.
- Live from a second network or region. Live run count: 1.
- Speeds 0.5x and 2x in a run. A real 10 MB file end to end.
- Lighthouse and budgets (verify step 8 is a stub).
- On phone, the lit-byte count differs between full motion (256) and reduced motion (15) for the same row click. I did not find the cause; both are nonzero, and no test asserts equality. Worth a look by the owner of the UI.
- Exact live commit.

## 7. Gate 2 scorecard (my scores; no Gate 2 criteria are written in the repo, so I used the product's own promises)

| Criterion | /10 | Evidence |
|---|---|---|
| Golden run works end to end | 9 | 5 of 5 pass local and live, 0 flakes in 2 runs each. Not 10: one sample, Chromium only. |
| Evidence per element (click, bytes, line, rule) | 9 | Row click shows rule, confidence, lit bytes, line at desktop. Phone has no line by design. |
| Verification honesty | 9 | Exact, 0 of 12,321; blind 0 of 13,500; hud.spec shows Not exact for mutated and "No reference" for user file. Blind set is one file from the same generator. |
| Honest failure | 9 | Red, plain reason, no picture, page recovers. Reason wording is the engine's, fine. |
| Accessibility | 8 | axe 0 violations in 40 runs. No manual or screen reader checks. |
| Reduced motion parity | 9 | Same values and same canvas. The lit-byte count on phone differs (see section 6). |
| Privacy / zero network | 9 | 0 cross-origin requests; 3 same-origin fetches only; CSP live with connect-src 'self'. |
| Speed | 9 | Start button 0.3 s local, 0.5 s live warm (3.9 s cold); 59.9 fps in beat 5 (t16-fps.json). |
| Test strength | 7 | UI break caught. Earlier note (latest register): 4 engine breaks were not caught. The golden-run test only guards one sample and mostly the line. |
| Judge on-ramp (README, live) | 8 | Try steps work; one wording mismatch; Proof Room (F-13) not built. |

Three weakest points:
1. Test strength: the UI guard rests on one default sample with 0 uncertain rows, so the amber path and any break that only touches uncertain rows would pass the golden run.
2. Accessibility is automated only (axe). No manual keyboard, zoom or screen reader pass beyond inspector.spec.ts.
3. The proof is Chromium, one machine, one sample family from one generator. Live commit cannot be tied to a hash, so "live equals main" is inferred.

## 8. Not done / risks
Skipped: screenshots (no SHOTS run), fresh-clone R-10, other browsers. Risk: the live deployment may change on the owner's next push; the live results are valid for 2026-11-25 about 19:45 to 19:55 IST only.
